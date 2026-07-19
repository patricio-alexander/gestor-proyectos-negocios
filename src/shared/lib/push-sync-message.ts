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

/** Variante corta para notas inline (tabla de apps, planes). */
export function formatPushSyncNote(data: PushSyncPayload): string {
  if (data.push_ok) return " · sync OK";
  if (data.push_skipped) return " · sync omitido (sin URL)";
  const toast = formatPushSyncToast(data, "sync");
  return toast ? ` · ${toast}` : " · sync falló";
}
