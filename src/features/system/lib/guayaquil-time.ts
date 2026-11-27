/** America/Guayaquil (UTC−5, sin DST). */

export const GUAYAQUIL_TZ = "America/Guayaquil";

/**
 * Valor de `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`)
 * interpretado como hora de pared en Guayaquil → Instant UTC.
 */
export function guayaquilWallTimeToUtc(localValue: string): Date {
  const m = String(localValue || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return new Date(NaN);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const s = Number(m[6] || 0);
  // Guayaquil = UTC-5 → UTC = local + 5h
  return new Date(Date.UTC(y, mo - 1, d, h + 5, mi, s));
}

/** Instant UTC → valor para datetime-local en Guayaquil. */
export function utcToGuayaquilInputValue(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: GUAYAQUIL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "00";
  let hour = get("hour");
  if (hour === "24") hour = "00";
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/** Instant UTC → texto legible en Guayaquil. */
export function formatGuayaquil(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-EC", {
    timeZone: GUAYAQUIL_TZ,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
