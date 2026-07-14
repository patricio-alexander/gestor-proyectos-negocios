import type { Subscription } from "@/src/features/subscriptions/types";
import type { DashboardOverview } from "../hooks/useDashboardOverview";

export const CHART_COLORS = {
  primary: "#3e6ae1",
  bright: "#5b9cff",
  soft: "#8bb8ff",
  success: "#16a34a",
  warning: "#ca8a04",
  danger: "#dc2626",
  cyan: "#0088cc",
} as const;

export type ChartSegment = {
  name: string;
  value: number;
  fill: string;
};

export function buildSubscriptionStatusData(
  subscriptions: DashboardOverview["subscriptions"],
): ChartSegment[] {
  return [
    { name: "Activas", value: subscriptions.active, fill: CHART_COLORS.primary },
    { name: "Vencidas", value: subscriptions.expired, fill: CHART_COLORS.warning },
    { name: "Canceladas", value: subscriptions.canceled, fill: CHART_COLORS.danger },
  ].filter((item) => item.value > 0);
}

export function buildOfferStatusData(
  offers: DashboardOverview["offers"],
): ChartSegment[] {
  return [
    { name: "Vigentes", value: offers.active, fill: CHART_COLORS.primary },
    { name: "Próximas", value: offers.upcoming, fill: CHART_COLORS.bright },
    { name: "Finalizadas", value: offers.expired, fill: CHART_COLORS.soft },
  ];
}

export function buildEcosystemData(data: DashboardOverview) {
  return [
    { name: "Apps", total: data.apps, fill: CHART_COLORS.primary },
    { name: "Planes", total: data.plans, fill: CHART_COLORS.bright },
    { name: "Módulos", total: data.modules, fill: CHART_COLORS.cyan },
    { name: "Ofertas", total: data.offers.total, fill: CHART_COLORS.soft },
  ];
}

export function buildSubscriptionTrend(subs: Subscription[]) {
  const buckets: { key: string; month: string; activaciones: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleDateString("es-PE", {
        month: "short",
        year: "2-digit",
      }),
      activaciones: 0,
    });
  }

  for (const sub of subs) {
    if (!sub.start_at) continue;
    const date = new Date(sub.start_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.activaciones += 1;
  }

  return buckets.map(({ month, activaciones }) => ({ month, activaciones }));
}

export function hasChartData(segments: ChartSegment[]) {
  return segments.some((item) => item.value > 0);
}
