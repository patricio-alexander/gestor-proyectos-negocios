export function formatPrice(price: number | null | undefined) {
  if (price == null) return null;
  return `$${price.toLocaleString("es-PE")}`;
}

export function formatCurrency(amount: number) {
  return `$${Math.round(amount).toLocaleString("es-PE")}`;
}

export function formatDate(
  dateStr: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function formatDateTimeLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type DateRangeStatus = "active" | "upcoming" | "expired";

export function getDateRangeStatus(
  startAt: string | null | undefined,
  expiresAt: string | null | undefined,
  now = new Date(),
): DateRangeStatus {
  const start = startAt ? new Date(startAt) : null;
  const end = expiresAt ? new Date(expiresAt) : null;
  if (start && now < start) return "upcoming";
  if (end && now > end) return "expired";
  return "active";
}

export function daysUntil(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
