/** Tipos y helpers puros — seguros para importar en Client Components. */

export type PushEntitlementOutcome = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  status?: number;
  app_name?: string;
  route?: string;
  module?: string;
};

export type PushAppResult = {
  app_name: string;
  ok: boolean;
  skipped?: boolean;
  error?: string;
  status?: number;
  route?: string;
  module?: string;
};

export type PushResponseFields = {
  push_ok: boolean;
  push_skipped: boolean;
  push_error: string | null;
  push_results: PushAppResult[];
};

/** Convierte errores crudos (HTML, red, timeout) en mensajes legibles. */
export function formatPushError(raw: string, status?: number): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    if (status === 404) {
      return "Ruta no encontrada — revisá entitlement_url (/subscription/entitlement)";
    }
    if (status === 401 || status === 403) {
      return "Secreto incorrecto — API Key del gestor ≠ GESTOR_SYNC_SECRET del backend";
    }
    if (status === 503) {
      return "Backend sin GESTOR_SYNC_SECRET — configurá el .env y reiniciá";
    }
    if (status) return `Error HTTP ${status}`;
    return "Error desconocido";
  }

  if (/^<!DOCTYPE|^<html/i.test(trimmed)) {
    if (status === 404) {
      return "Ruta no encontrada — revisá entitlement_url";
    }
    if (status === 401 || status === 403) {
      return "Secreto incorrecto — API Key ≠ GESTOR_SYNC_SECRET";
    }
    if (status === 503) return "Backend sin GESTOR_SYNC_SECRET configurado";
    if (status) return `HTTP ${status} — respuesta inesperada del backend`;
    return "Respuesta inesperada del servidor";
  }

  if (/no autorizado|gestor sync/i.test(trimmed)) {
    return "Secreto incorrecto — API Key del gestor ≠ GESTOR_SYNC_SECRET del backend";
  }
  if (/gestor_sync_secret/i.test(trimmed)) {
    return "Backend sin GESTOR_SYNC_SECRET — configurá el .env y reiniciá";
  }

  if (
    /fetch failed|ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT|AbortError|timed out|network/i.test(
      trimmed,
    )
  ) {
    return "Sin conexión — backend apagado o URL incorrecta";
  }

  if (trimmed.length > 120) return `${trimmed.slice(0, 117)}…`;
  return trimmed;
}

function outcomeToAppResult(outcome: PushEntitlementOutcome): PushAppResult {
  return {
    app_name: outcome.app_name ?? "App",
    ok: outcome.ok,
    skipped: outcome.skipped,
    status: outcome.status,
    route: outcome.route,
    module: outcome.module,
    error:
      outcome.error != null
        ? formatPushError(outcome.error, outcome.status)
        : undefined,
  };
}

/** Resumen corto para APIs y toasts (multi-app). */
export function summarizePushResults(results: PushAppResult[]): string | null {
  const ok = results.filter((r) => r.ok && !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const failed = results.filter((r) => !r.ok && !r.skipped);

  if (failed.length === 0) return null;

  const parts: string[] = [];
  if (ok.length > 0) {
    parts.push(
      `OK: ${ok.map((r) => `${r.app_name}${r.route ? ` (${r.route})` : ""}`).join(", ")}`,
    );
  }
  if (skipped.length > 0) {
    parts.push(`Sin URL: ${skipped.map((r) => r.app_name).join(", ")}`);
  }
  parts.push(
    `Falló: ${failed
      .map((r) => {
        const where = r.module ? `${r.module}` : r.app_name;
        return `${where}: ${r.error ?? "error"}${r.route ? ` · ${r.route}` : ""}`;
      })
      .join("; ")}`,
  );
  return parts.join(". ");
}

/** Campos listos para incluir en JSON de respuesta de API (una app). */
export function toPushResponseFields(
  result: PushEntitlementOutcome,
): PushResponseFields {
  const push_results = [outcomeToAppResult(result)];
  const push_error = summarizePushResults(push_results);
  return {
    push_ok: Boolean(result.ok && !result.skipped),
    push_skipped: Boolean(result.skipped),
    push_error,
    push_results,
  };
}

/** Agrega resultados de varias apps en la respuesta de API. */
export function toBatchPushResponseFields(
  results: PushAppResult[],
): PushResponseFields {
  if (results.length === 0) {
    return {
      push_ok: false,
      push_skipped: true,
      push_error: null,
      push_results: [],
    };
  }

  const failed = results.filter((r) => !r.ok && !r.skipped);
  const allSkipped = results.every((r) => r.skipped);
  const allOk = failed.length === 0 && !allSkipped;

  return {
    push_ok: allOk,
    push_skipped: allSkipped,
    push_error: summarizePushResults(results),
    push_results: results,
  };
}
