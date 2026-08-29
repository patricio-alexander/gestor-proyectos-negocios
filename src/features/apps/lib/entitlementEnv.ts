/** Ambiente del backend destino según entitlement_url. */

import type { AppSyncHealthRow, AppSyncHealthState } from "./probe-entitlement";

export type EntitlementEnvKind = "development" | "staging" | "production" | "unknown";

export type EntitlementEnvInfo = {
  kind: EntitlementEnvKind;
  label: string;
  host: string;
};

const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

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

function statusFromHealth(state: AppSyncHealthState | "checking" | null | undefined): {
  statusLabel: string;
  toneClass: string;
  titleExtra: string;
  ready: boolean;
} {
  switch (state) {
    case "checking":
      return {
        statusLabel: "Comprobando…",
        toneClass: "text-[var(--gp-text-muted)]",
        titleExtra: "Verificando backend y suscripción",
        ready: false,
      };
    case "online":
      return {
        statusLabel: "En línea",
        toneClass: "text-emerald-700",
        titleExtra: "Comunicación OK · suscripción activa",
        ready: true,
      };
    case "maintenance":
      return {
        statusLabel: "Mantenimiento",
        toneClass: "text-amber-700",
        titleExtra: "La app está en mantenimiento",
        ready: false,
      };
    case "subscription_expired":
      return {
        statusLabel: "Suscripción vencida",
        toneClass: "text-red-600",
        titleExtra: "El plan expiró — renová en Suscripciones",
        ready: false,
      };
    case "subscription_inactive":
    case "no_subscription":
      return {
        statusLabel: "Sin suscripción",
        toneClass: "text-amber-700",
        titleExtra: "Asigná un plan y empujá entitlement",
        ready: false,
      };
    case "auth_failed":
      return {
        statusLabel: "Secreto incorrecto",
        toneClass: "text-red-600",
        titleExtra: "API Key del gestor ≠ GESTOR_SYNC_SECRET del backend",
        ready: false,
      };
    case "backend_no_secret":
      return {
        statusLabel: "Backend sin secreto",
        toneClass: "text-red-600",
        titleExtra: "Falta GESTOR_SYNC_SECRET en el .env del backend",
        ready: false,
      };
    case "route_not_found":
      return {
        statusLabel: "Ruta incorrecta",
        toneClass: "text-red-600",
        titleExtra: "Revisá entitlement_url (/subscription/entitlement)",
        ready: false,
      };
    case "offline":
      return {
        statusLabel: "Sin comunicación",
        toneClass: "text-red-600",
        titleExtra: "Backend apagado o URL inalcanzable",
        ready: false,
      };
    case "no_secret":
      return {
        statusLabel: "Sin API Key",
        toneClass: "text-amber-700",
        titleExtra: "Generá la API Key en Editar app",
        ready: false,
      };
    case "not_configured":
      return {
        statusLabel: "Sin URL",
        toneClass: "text-[var(--gp-text-muted)]",
        titleExtra: "Configurá entitlement_url hacia el backend",
        ready: false,
      };
    default:
      return {
        statusLabel: "Sin verificar",
        toneClass: "text-amber-700",
        titleExtra: "Todavía no se comprobó el backend",
        ready: false,
      };
  }
}

export function entitlementSyncSummary(
  opts: {
    entitlement_url?: string | null;
    has_entitlement_secret?: boolean;
  },
  health?: AppSyncHealthRow | AppSyncHealthState | "checking" | null,
): {
  env: EntitlementEnvInfo;
  ready: boolean;
  primary: string;
  secondary: string;
  tertiary: string;
  title: string;
  toneClass: string;
  module: string;
  route: string;
} {
  const env = classifyEntitlementEnv(opts.entitlement_url);
  const hasSecret = Boolean(opts.has_entitlement_secret);

  const healthRow =
    health && typeof health === "object" && "state" in health ? health : null;
  const healthState =
    health === "checking"
      ? "checking"
      : healthRow?.state ??
        (typeof health === "string" ? (health as AppSyncHealthState) : null) ??
        (!opts.entitlement_url
          ? "not_configured"
          : !hasSecret
            ? "no_secret"
            : null);

  const { statusLabel, toneClass, titleExtra, ready } = statusFromHealth(healthState);

  const module = healthRow?.module ?? "Suscripción";
  const route = healthRow?.route ?? "";
  const detail = healthRow?.detail ?? titleExtra;

  if (env.kind === "unknown" && !opts.entitlement_url) {
    return {
      env,
      ready: false,
      primary: "Sin URL",
      secondary: "",
      tertiary: "Configurá entitlement_url en Editar app",
      title: "Configurá la URL entitlement hacia el backend de la app",
      toneClass: "text-[var(--gp-text-muted)]",
      module,
      route,
    };
  }

  const envTone =
    healthState === "online"
      ? env.kind === "production"
        ? "text-emerald-700"
        : env.kind === "development"
          ? "text-sky-700"
          : env.kind === "staging"
            ? "text-violet-700"
            : toneClass
      : toneClass;

  return {
    env,
    ready: ready && Boolean(opts.entitlement_url) && hasSecret,
    primary: `${env.label} · ${statusLabel}`,
    secondary: env.host,
    tertiary: detail,
    title: [module, opts.entitlement_url, route, detail, healthRow?.latency_ms != null ? `${healthRow.latency_ms} ms` : ""]
      .filter(Boolean)
      .join(" — "),
    toneClass: envTone,
    module,
    route,
  };
}
