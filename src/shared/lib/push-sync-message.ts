import type { PushAppResult } from "./push-entitlement-shared";
import { summarizePushResults } from "./push-entitlement-shared";

export type PushSyncPayload = {
  push_ok?: boolean;
  push_skipped?: boolean;
  push_error?: string | null;
  push_results?: PushAppResult[];
};

/** Mensaje para toast cuando hubo sync parcial o fallido. Null = todo OK o sin sync. */
export function formatPushSyncToast(
  data: PushSyncPayload,
  prefix = "Guardado, pero sync incompleto",
): string | null {
  if (data.push_results?.length) {
    const summary = summarizePushResults(data.push_results);
    if (summary) return `${prefix}: ${summary}`;
  }

  if (data.push_error) {
    return `${prefix}: ${data.push_error}`;
  }

  if (data.push_ok === false && !data.push_skipped) {
    return `${prefix}: una o más apps no recibieron el entitlement`;
  }

  return null;
}

/** Mensaje cuando el sync fue exitoso (null si no aplica). */
export function formatPushSyncSuccess(data: PushSyncPayload): string | null {
  if (!data.push_ok || data.push_skipped) return null;
  const results = data.push_results?.filter((r) => r.ok && !r.skipped) ?? [];
  if (results.length === 0) return "Sync OK · Entitlement enviado al backend";
  if (results.length === 1) {
    const r = results[0];
    const where = r.module ? `${r.module}` : r.app_name;
    return `Sync OK · ${where}${r.route ? ` · ${r.route}` : ""}`;
  }
  return `Sync OK · ${results.map((r) => `${r.app_name}${r.route ? ` (${r.route})` : ""}`).join(", ")}`;
}

/** Variante corta para notas inline (tabla de apps, planes). */
export function formatPushSyncNote(data: PushSyncPayload): string {
  if (data.push_ok) {
    const ok = formatPushSyncSuccess(data);
    return ok ? ` · ${ok}` : " · sync OK";
  }
  if (data.push_skipped) return " · sync omitido (sin URL entitlement)";
  const toast = formatPushSyncToast(data, "sync");
  return toast ? ` · ${toast}` : " · sync falló";
}
