"use client";

import { useQuery } from "@tanstack/react-query";
import type { Subscription } from "@/src/features/subscriptions/types";
import type { Offer } from "@/src/features/offers/types";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";
import { getDateRangeStatus, daysUntil } from "@/src/shared/utils/format-display";
import { buildSubscriptionTrend } from "../lib/chart-data";
import {
  buildFinancialKpis,
  EMPTY_FINANCIAL,
  type FinancialKpis,
} from "../lib/financial-kpis";
import type { Plan } from "@/src/features/plans/types";
import type { App } from "@/src/features/apps/types";

export type DashboardOverview = {
  apps: number;
  appList: App[];
  plans: number;
  modules: number;
  subscriptions: {
    total: number;
    active: number;
    expired: number;
    canceled: number;
  };
  offers: {
    total: number;
    active: number;
    upcoming: number;
    expired: number;
  };
  recentSubscriptions: Subscription[];
  expiringSubscriptions: Subscription[];
  expiringOffers: Offer[];
  subscriptionTrend: { month: string; activaciones: number }[];
  financial: FinancialKpis;
};

const EMPTY: DashboardOverview = {
  apps: 0,
  appList: [],
  plans: 0,
  modules: 0,
  subscriptions: { total: 0, active: 0, expired: 0, canceled: 0 },
  offers: { total: 0, active: 0, upcoming: 0, expired: 0 },
  recentSubscriptions: [],
  expiringSubscriptions: [],
  expiringOffers: [],
  subscriptionTrend: [],
  financial: EMPTY_FINANCIAL,
};

async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const [apps, plans, modules, subscriptions, offers] = await Promise.all([
    fetchJson<App[]>("/api/apps"),
    fetchJson<Plan[]>("/api/plans"),
    fetchJson<{ deleted_at: string | null }[]>("/api/modules"),
    fetchJson<Subscription[]>("/api/subscriptions"),
    fetchJson<Offer[]>("/api/offers"),
  ]);

  const subs = subscriptions;
  const offs = offers;
  const plansList = plans;

  const expiringSubscriptions = subs
    .filter(
      (s) =>
        s.status === "ACTIVE" &&
        s.expires_at &&
        (daysUntil(s.expires_at) ?? 99) <= 30 &&
        (daysUntil(s.expires_at) ?? -1) >= 0,
    )
    .slice(0, 5);

  const expiringOffers = offs
    .filter((o) => {
      const status = getDateRangeStatus(o.start_at, o.expires_at);
      const days = daysUntil(o.expires_at);
      return status === "active" && days != null && days <= 14 && days >= 0;
    })
    .slice(0, 5);

  return {
    apps: apps.length,
    appList: apps,
    plans: plans.length,
    modules: modules.filter((m) => !m.deleted_at).length,
    subscriptions: {
      total: subs.length,
      active: subs.filter((s) => s.status === "ACTIVE").length,
      expired: subs.filter((s) => s.status === "EXPIRED").length,
      canceled: subs.filter((s) => s.status === "CANCELED").length,
    },
    offers: {
      total: offs.length,
      active: offs.filter(
        (o) => getDateRangeStatus(o.start_at, o.expires_at) === "active",
      ).length,
      upcoming: offs.filter(
        (o) => getDateRangeStatus(o.start_at, o.expires_at) === "upcoming",
      ).length,
      expired: offs.filter(
        (o) => getDateRangeStatus(o.start_at, o.expires_at) === "expired",
      ).length,
    },
    recentSubscriptions: subs.slice(0, 5),
    expiringSubscriptions,
    expiringOffers,
    subscriptionTrend: buildSubscriptionTrend(subs),
    financial: buildFinancialKpis(subs, plansList),
  };
}

export function useDashboardOverview() {
  const overviewQuery = useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: fetchDashboardOverview,
  });

  return {
    data: overviewQuery.data ?? EMPTY,
    loading: overviewQuery.isLoading,
    refetch: overviewQuery.refetch,
  };
}
