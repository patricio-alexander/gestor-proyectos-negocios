/** Comprueba comunicación real con el backend de la app y resume suscripción. */

import {
  describeSubscriptionHealth,
  formatHttpAuthError,
  formatNetworkError,
  parseEntitlementRoute,
  parseSubscriptionSnapshot,
  type EntitlementRouteInfo,
  type SubscriptionSnapshot,
} from "./sync-diagnostics";

export type EntitlementProbeResult = {
  online: boolean;
  status?: number;
  error?: string;
  latencyMs: number;
};

export type AppSyncHealthState =
  | "not_configured"
  | "no_secret"
  | "offline"
  | "auth_failed"
  | "route_not_found"
  | "backend_no_secret"
  | "online"
  | "subscription_expired"
  | "subscription_inactive"
  | "maintenance"
  | "no_subscription";

export type AppSyncHealthRow = {
  app_id: number;
  state: AppSyncHealthState;
  latency_ms: number | null;
  http_status: number | null;
  error: string | null;
  /** Mensaje corto legible (error o OK). */
  detail: string;
  /** Ej. Suscripción · Store */
  module: string;
  /** Ej. PUT /storeapi/subscription/entitlement */
  route: string;
  plan_name: string | null;
  subscription_status: string | null;
  auth_ok: boolean;
  subscription: SubscriptionSnapshot | null;
  route_info: EntitlementRouteInfo | null;
};

const PROBE_TIMEOUT_MS = 5_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = PROBE_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "manual",
    cache: "no-store",
  });
}

/** GET /subscription — estado local de la app (público). */
async function readSubscriptionState(readUrl: string): Promise<{
  ok: boolean;
  status?: number;
  body?: unknown;
  error?: string;
  latencyMs: number;
}> {
  const started = Date.now();
  try {
    const res = await fetchWithTimeout(readUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const text = await res.text().catch(() => "");
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }
    return {
      ok: res.ok,
      status: res.status,
      body,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    return {
      ok: false,
      error: formatNetworkError(err instanceof Error ? err.message : String(err)),
      latencyMs: Date.now() - started,
    };
  }
}

/** PUT vacío — solo valida Authorization (400 = secreto OK). */
async function probeGestorAuth(
  pushUrl: string,
  secret: string,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetchWithTimeout(
      pushUrl,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ _gestor_probe: true }),
      },
      4_000,
    );
    const text = await res.text().catch(() => "");

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: res.status,
        error: formatHttpAuthError(res.status, text),
      };
    }
    if (res.status === 503 && /gestor_sync_secret/i.test(text)) {
      return {
        ok: false,
        status: res.status,
        error: formatHttpAuthError(res.status, text),
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        status: res.status,
        error: formatHttpAuthError(404, text),
      };
    }
    if (res.status === 400 || res.ok) {
      return { ok: true, status: res.status };
    }
    return {
      ok: false,
      status: res.status,
      error: formatHttpAuthError(res.status, text),
    };
  } catch (err) {
    return {
      ok: false,
      error: formatNetworkError(err instanceof Error ? err.message : String(err)),
    };
  }
}

export async function probeEntitlementUrl(
  url: string,
  secret?: string | null,
): Promise<EntitlementProbeResult> {
  const route = parseEntitlementRoute(url);
  const target = route?.readUrl || url;
  const started = Date.now();
  try {
    const res = await fetchWithTimeout(target, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    return {
      online: true,
      status: res.status,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    return {
      online: false,
      error: formatNetworkError(err instanceof Error ? err.message : String(err)),
      latencyMs: Date.now() - started,
    };
  }
}

/** Diagnóstico completo para la columna Sync. */
export async function probeAppSyncHealth(
  appId: number,
  entitlementUrl: string,
  secret?: string | null,
): Promise<AppSyncHealthRow> {
  const routeInfo = parseEntitlementRoute(entitlementUrl);
  const module = routeInfo?.module ?? "Suscripción";
  const route = routeInfo?.pushRoute ?? entitlementUrl;

  const baseRow = (
    partial: Partial<AppSyncHealthRow> & Pick<AppSyncHealthRow, "state" | "detail">,
  ): AppSyncHealthRow => ({
    app_id: appId,
    latency_ms: null,
    http_status: null,
    error: null,
    module,
    route,
    plan_name: null,
    subscription_status: null,
    auth_ok: false,
    subscription: null,
    route_info: routeInfo,
    ...partial,
  });

  if (!entitlementUrl.trim()) {
    return baseRow({
      state: "not_configured",
      detail: "Falta entitlement_url — configurá el enlace al backend",
    });
  }

  if (!secret?.trim()) {
    return baseRow({
      state: "no_secret",
      detail: "Falta API Key — generá una en Editar app y copiala al .env del backend",
    });
  }

  if (!routeInfo) {
    return baseRow({
      state: "route_not_found",
      detail: "URL entitlement inválida — debe ser http(s)://host/prefix/subscription/entitlement",
    });
  }

  const read = await readSubscriptionState(routeInfo.readUrl);
  if (read.error || !read.ok) {
    if (read.status === 404) {
      return baseRow({
        state: "route_not_found",
        http_status: read.status ?? null,
        latency_ms: read.latencyMs,
        error: read.error ?? "Ruta no encontrada",
        detail: `${read.error ?? "Ruta no encontrada"} · ${routeInfo.readRoute}`,
      });
    }
    return baseRow({
      state: "offline",
      http_status: read.status ?? null,
      latency_ms: read.latencyMs,
      error: read.error ?? `HTTP ${read.status ?? "?"}`,
      detail: read.error ?? "Backend apagado o URL incorrecta",
    });
  }

  const subscription = parseSubscriptionSnapshot(read.body);
  const subHealth = describeSubscriptionHealth(subscription);

  const auth = await probeGestorAuth(routeInfo.pushUrl, secret);
  if (!auth.ok) {
    const isBackendNoSecret = /GESTOR_SYNC_SECRET no configurado/i.test(auth.error || "");
    return baseRow({
      state: isBackendNoSecret ? "backend_no_secret" : "auth_failed",
      http_status: auth.status ?? null,
      error: auth.error ?? "Auth fallida",
      detail: auth.error ?? "Secreto incorrecto entre gestor y backend",
      plan_name: subscription?.plan_name ?? null,
      subscription_status: subscription?.status ?? null,
      auth_ok: false,
      subscription,
    });
  }

  if (subscription?.maintenance) {
    return baseRow({
      state: "maintenance",
      http_status: read.status ?? null,
      latency_ms: read.latencyMs,
      detail: subHealth.detail,
      plan_name: subscription.plan_name,
      subscription_status: subscription.status,
      auth_ok: true,
      subscription,
    });
  }

  if (!subscription?.subscribed || subscription.expired) {
    const state: AppSyncHealthState =
      subscription?.expired || subscription?.status === "EXPIRED"
        ? "subscription_expired"
        : "subscription_inactive";
    return baseRow({
      state,
      http_status: read.status ?? null,
      latency_ms: read.latencyMs,
      detail: subHealth.detail,
      plan_name: subscription?.plan_name ?? null,
      subscription_status: subscription?.status ?? null,
      auth_ok: true,
      subscription,
    });
  }

  return baseRow({
    state: "online",
    http_status: read.status ?? null,
    latency_ms: read.latencyMs,
    detail: `${subHealth.label} · ${routeInfo.pushRoute}`,
    plan_name: subscription?.plan_name ?? null,
    subscription_status: subscription?.status ?? null,
    auth_ok: true,
    subscription,
  });
}

/** Mapea estado enriquecido al live state simple (compatibilidad). */
export function syncStateToLive(
  state: AppSyncHealthState,
): "online" | "offline" | "no_secret" | "not_configured" {
  switch (state) {
    case "online":
    case "maintenance":
    case "subscription_expired":
    case "subscription_inactive":
    case "no_subscription":
      return "online";
    case "not_configured":
      return "not_configured";
    case "no_secret":
      return "no_secret";
    default:
      return "offline";
  }
}
