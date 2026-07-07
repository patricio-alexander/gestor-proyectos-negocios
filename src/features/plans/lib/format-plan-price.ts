export function formatPlanPrice(price: number | null | undefined) {
  if (price == null) return null;
  return `$${price.toLocaleString("es-PE")}`;
}

export function getAnnualSavingsPercent(
  monthly: number | null | undefined,
  annual: number | null | undefined,
) {
  if (monthly == null || annual == null || monthly <= 0) return null;
  const fullYearMonthly = monthly * 12;
  if (fullYearMonthly <= annual) return null;
  return Math.round(((fullYearMonthly - annual) / fullYearMonthly) * 100);
}
