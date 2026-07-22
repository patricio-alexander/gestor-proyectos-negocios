/** Ambiente del backend destino según entitlement_url. */

export type EntitlementEnvKind = "development" | "staging" | "production" | "unknown";

export type EntitlementEnvInfo = {
  kind: EntitlementEnvKind;
  /** Etiqueta corta: Desarrollo | Pruebas | Producción */
  label: string;
  /** Host mostrado (sin path) o vacío. */
  host: string;
};

const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

/**
 * Clasifica la URL de entitlement del gestor → backend de la app.
 * - localhost / 127.* → Desarrollo
 * - staging, test, prueb, uat, preview… → Pruebas
 * - https con dominio real → Producción
 */
export function classifyEntitlementEnv(url: string | null | undefined): EntitlementEnvInfo {
  const raw = String(url || "").trim();
  if (!raw) {
    return { kind: "unknown", label: "Sin URL", host: "" };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { kind: "unknown", label: "URL inválida", host: "" };
  }

  const host = parsed.hostname.toLowerCase();
  const hostPort =
    parsed.port && parsed.port !== "80" && parsed.port !== "443"
      ? `${host}:${parsed.port}`
      : host;

  if (
    LOCAL_HOSTS.has(host) ||
    host.endsWith(".local") ||
    host.endsWith(".localhost") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return { kind: "development", label: "Desarrollo", host: hostPort };
  }

  const haystack = `${host} ${parsed.pathname}`.toLowerCase();
  if (
    /\b(staging|stage|stg|test|prueba|pruebas|uat|qa|preview|sandbox|dev)\b/.test(
      haystack,
    ) ||
    host.includes("staging") ||
    host.includes("test") ||
    host.includes("prueba") ||
    host.endsWith(".vercel.app") ||
    host.includes("ngrok")
  ) {
    return { kind: "staging", label: "Pruebas", host: hostPort };
  }

  if (parsed.protocol === "https:" || (!LOCAL_HOSTS.has(host) && host.includes("."))) {
    return { kind: "production", label: "Producción", host: hostPort };
  }

  return { kind: "unknown", label: "Desconocido", host: hostPort };
}

export function entitlementSyncSummary(
  opts: {
    entitlement_url?: string | null;
    has_entitlement_secret?: boolean;
  },
  live?: "checking" | "online" | "offline" | "no_secret" | "not_configured" | null,
): {
  env: EntitlementEnvInfo;
  ready: boolean;
  /** Línea principal en la tabla Sync. */
  primary: string;
  /** Subtítulo (host). */
  secondary: string;
  title: string;
  toneClass: string;
} {
  const env = classifyEntitlementEnv(opts.entitlement_url);
  if (env.kind === "unknown" && !opts.entitlement_url) {
    return {
      env,
      ready: false,
      primary: "Sin URL",
      secondary: "",
      title: "Configurá la URL entitlement hacia el backend de la app",
      toneClass: "text-[var(--gp-text-muted)]",
    };
  }

  const hasSecret = Boolean(opts.has_entitlement_secret);
  const configured = Boolean(opts.entitlement_url) && hasSecret;

  const liveState =
    live ??
    (!opts.entitlement_url
      ? "not_configured"
      : !hasSecret
        ? "no_secret"
        : null);

  let statusLabel: string;
  let toneClass: string;
  let titleExtra = "";

  if (liveState === "checking") {
    statusLabel = "Comprobando…";
    toneClass = "text-[var(--gp-text-muted)]";
    titleExtra = "Verificando si el backend responde";
  } else if (liveState === "online") {
    statusLabel = "En línea";
    toneClass =
      env.kind === "production"
        ? "text-emerald-700"
        : env.kind === "development"
          ? "text-sky-700"
          : env.kind === "staging"
            ? "text-violet-700"
            : "text-emerald-700";
    titleExtra = "Backend responde (hay comunicación)";
  } else if (liveState === "offline") {
    statusLabel = "Sin comunicación";
    toneClass = "text-red-600";
    titleExtra = "No responde: backend apagado o URL inalcanzable";
  } else if (liveState === "no_secret" || !hasSecret) {
    statusLabel = "Sin secreto";
    toneClass = "text-amber-700";
    titleExtra = "Falta API Key del gestor";
  } else if (liveState === "not_configured") {
    statusLabel = "Sin URL";
    toneClass = "text-[var(--gp-text-muted)]";
    titleExtra = "Sin URL entitlement";
  } else {
    statusLabel = "Sin verificar";
    toneClass = "text-amber-700";
    titleExtra = "Todavía no se comprobó el backend";
  }

  return {
    env,
    ready: configured && liveState === "online",
    primary: `${env.label} · ${statusLabel}`,
    secondary: env.host,
    title: opts.entitlement_url
      ? `${env.label}: ${opts.entitlement_url}${titleExtra ? ` — ${titleExtra}` : ""}`
      : "Sin URL entitlement",
    toneClass,
  };
}
