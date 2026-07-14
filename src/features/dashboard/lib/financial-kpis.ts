import type { Subscription } from "@/src/features/subscriptions/types";
import type { Plan } from "@/src/features/plans/types";
import { CHART_COLORS } from "./chart-data";

export type FinancialKpis = {
  mrr: number;
  arr: number;
  avgTicket: number;
  collectedRevenue: number;
  revenueTrend: { month: string; ingresos: number }[];
  revenueByPeriod: { name: string; value: number; fill: string }[];
};

const EMPTY_FINANCIAL: FinancialKpis = {
  mrr: 0,
  arr: 0,
  avgTicket: 0,
  collectedRevenue: 0,
  revenueTrend: [],
  revenueByPeriod: [],
};

function toMonthlyAmount(price: number, period: string) {
  return period === "ANNUALLY" ? price / 12 : price;
}

export function buildFinancialKpis(
  subscriptions: Subscription[],
  plans: Plan[],
): FinancialKpis {
  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE");

  let mrr = 0;
  let monthlyValue = 0;
  let annualValue = 0;
  let ticketSum = 0;
  let ticketCount = 0;

  for (const sub of activeSubs) {
    const price = sub.price ?? 0;
    if (price <= 0) continue;
    mrr += toMonthlyAmount(price, sub.period ?? "MONTHLY");
    ticketSum += price;
    ticketCount += 1;
    if (sub.period === "ANNUALLY") annualValue += price;
    else monthlyValue += price;
  }

  let collectedRevenue = 0;
  for (const sub of subscriptions) {
    const price = sub.price ?? 0;
    if (price > 0 && sub.status === "ACTIVE") {
      collectedRevenue += price;
    }
  }

  const revenueTrend = buildRevenueTrend(subscriptions);
  const revenueByPeriod = [
    { name: "Planes mensuales", value: monthlyValue, fill: CHART_COLORS.primary },
    { name: "Planes anuales", value: annualValue, fill: CHART_COLORS.bright },
  ].filter((item) => item.value > 0);

  return {
    mrr: Math.round(mrr),
    arr: Math.round(mrr * 12),
    avgTicket: ticketCount > 0 ? Math.round(ticketSum / ticketCount) : 0,
    collectedRevenue: Math.round(collectedRevenue),
    revenueTrend,
    revenueByPeriod,
  };
}

function buildRevenueTrend(subscriptions: Subscription[]) {
  const buckets: { key: string; month: string; ingresos: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleDateString("es-PE", {
        month: "short",
        year: "2-digit",
      }),
      ingresos: 0,
    });
  }

  for (const sub of subscriptions) {
    if (!sub.start_at || !sub.price) continue;
    const date = new Date(sub.start_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.ingresos += sub.price;
  }

  return buckets.map(({ month, ingresos }) => ({
    month,
    ingresos: Math.round(ingresos),
  }));
}

export { EMPTY_FINANCIAL };
