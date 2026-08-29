/** Rutas, estados de suscripción y mensajes legibles para la columna Sync del gestor. */

export type EntitlementRouteInfo = {
  host: string;
  apiPrefix: string;
  /** Ej. PUT /storeapi/subscription/entitlement */
  pushRoute: string;
  /** Ej. GET /storeapi/subscription */
  readRoute: string;
  module: string;
  pushUrl: string;
  readUrl: string;
};

export type SubscriptionSnapshot = {
  subscribed: boolean;
  maintenance: boolean;
  plan_name: string | null;
  status: string | null;
  expires_at: string | null;
  expired: boolean;
  source: string | null;
  synced_at: string | null;
};

const MODULE_BY_PREFIX: Record<string, string> = {
  eddeliapi: "EdDeli · Suscripción",
  storeapi: "Store · Suscripción",
  tiendaapi: "Tienda · Suscripción",
};

/** Parsea entitlement_url → rutas y módulo para mostrar en UI. */
export function parseEntitlementRoute(url: string): EntitlementRouteInfo | null {
  const raw = String(url || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    const host =
      parsed.port && parsed.port !== "80" && parsed.port !== "443"
        ? `${parsed.hostname}:${parsed.port}`
        : parsed.hostname;

    const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/");
    const apiPrefix = parts[0] || "api";
    const pushPath = parsed.pathname.replace(/\/$/, "") || parsed.pathname;
    const readPath = pushPath.replace(/\/entitlement\/?$/i, "") || pushPath;

    const module =
      MODULE_BY_PREFIX[apiPrefix.toLowerCase()] ??
      `${apiPrefix} · Suscripción`;

    const readUrl = `${parsed.origin}${readPath.startsWith("/") ? readPath : `/${readPath}`}`;

    return {
      host,
      apiPrefix,
      pushRoute: `PUT ${pushPath}`,
      readRoute: `GET ${readPath}`,
      module,
      pushUrl: raw.replace(/\/$/, ""),
      readUrl,
    };
  } catch {
    return null;
  }
}

function coerceJson(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/** Resume el payload de GET /subscription del backend de la app. */
export function parseSubscriptionSnapshot(body: unknown): SubscriptionSnapshot | null {
  const data = coerceJson(body);
  if (!data) return null;

  const subRaw = data.subscription;
  const sub =
    subRaw && typeof subRaw === "object" && !Array.isArray(subRaw)
      ? (subRaw as Record<string, unknown>)
      : null;

  const expiresAt =
    sub?.expires_at != null ? String(sub.expires_at) : null;
  const expired =
    expiresAt != null && !Number.isNaN(Date.parse(expiresAt))
      ? new Date(expiresAt) < new Date()
      : false;

  const status = sub?.status != null ? String(sub.status) : null;
  const meta =
    data.meta && typeof data.meta === "object" && !Array.isArray(data.meta)
      ? (data.meta as Record<string, unknown>)
      : null;

  return {
    subscribed: Boolean(data.subscribed),
    maintenance: Boolean(data.maintenance),
    plan_name: sub?.plan_name != null ? String(sub.plan_name) : null,
    status,
    expires_at: expiresAt,
    expired,
    source: meta?.source != null ? String(meta.source) : null,
    synced_at: meta?.syncedAt != null ? String(meta.syncedAt) : null,
  };
}

export function formatNetworkError(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "Sin conexión con el backend";
  if (/AbortError|timed out|timeout/i.test(trimmed)) {
    return "Tiempo de espera agotado — el backend no respondió";
  }
  if (/ECONNREFUSED|fetch failed|ENOTFOUND|EHOSTUNREACH|network/i.test(trimmed)) {
    return "Backend apagado o URL incorrecta";
  }
  if (trimmed.length > 100) return `${trimmed.slice(0, 97)}…`;
  return trimmed;
}

export function formatHttpAuthError(status: number, bodyText?: string): string {
  const text = String(bodyText || "").toLowerCase();
  if (status === 503 && /gestor_sync_secret/i.test(text)) {
    return "Backend sin GESTOR_SYNC_SECRET — configurá el .env y reiniciá";
  }
  if (status === 401 || status === 403) {
    return "Secreto incorrecto — API Key del gestor ≠ GESTOR_SYNC_SECRET del backend";
  }
  if (status === 404) {
    return "Ruta no encontrada — revisá entitlement_url (debe terminar en /subscription/entitlement)";
  }
  if (status === 405) {
    return "Backend en línea — la ruta existe pero el método no coincide";
  }
  if (status >= 500) {
    return `Error del backend (HTTP ${status})`;
  }
  return `HTTP ${status}${bodyText ? `: ${bodyText.slice(0, 80)}` : ""}`;
}

/** Mensaje corto según estado de suscripción local en la app. */
export function describeSubscriptionHealth(
  snap: SubscriptionSnapshot | null,
): { ok: boolean; label: string; detail: string } {
  if (!snap) {
    return {
      ok: false,
      label: "Sin datos de suscripción",
      detail: "El backend respondió pero no devolvió suscripción — empujá entitlement desde el gestor",
    };
  }

  if (snap.maintenance) {
    return {
      ok: false,
      label: "App en mantenimiento",
      detail: "La app está en mantenimiento — desactivá mantenimiento en Apps o en el backend",
    };
  }

  if (!snap.subscribed) {
    if (snap.expired || snap.status === "EXPIRED") {
      return {
        ok: false,
        label: "Suscripción vencida",
        detail: snap.plan_name
          ? `Plan «${snap.plan_name}» expiró${snap.expires_at ? ` (${snap.expires_at.slice(0, 10)})` : ""}`
          : "Asigná o renueva un plan en Suscripciones",
      };
    }
    if (snap.status === "CANCELLED" || snap.status === "CANCELED") {
      return {
        ok: false,
        label: "Suscripción cancelada",
        detail: snap.plan_name ? `Plan «${snap.plan_name}» cancelado` : "Reactivá un plan en Suscripciones",
      };
    }
    return {
      ok: false,
      label: "Sin suscripción activa",
      detail: "Asigná un plan en Suscripciones y empujá entitlement",
    };
  }

  if (snap.expired) {
    return {
      ok: false,
      label: "Suscripción vencida",
      detail: snap.plan_name
        ? `Plan «${snap.plan_name}» expiró${snap.expires_at ? ` (${snap.expires_at.slice(0, 10)})` : ""}`
        : "Renová el plan en Suscripciones",
    };
  }

  const plan = snap.plan_name ? `Plan «${snap.plan_name}»` : "Suscripción activa";
  const syncHint =
    snap.source === "gestor_push"
      ? " · sync desde gestor OK"
      : snap.source === "gestor_pull"
        ? " · sync por pull"
        : snap.source
          ? ` · origen: ${snap.source}`
          : "";

  return {
    ok: true,
    label: plan,
    detail: `${plan}${snap.status ? ` (${snap.status})` : ""}${syncHint}`,
  };
}
