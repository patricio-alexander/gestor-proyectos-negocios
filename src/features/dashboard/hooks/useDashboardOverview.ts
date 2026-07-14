"use client";

import { useCallback, useEffect, useState } from "react";
import type { Subscription } from "@/src/features/subscriptions/types";
import type { Offer } from "@/src/features/offers/types";
import { apiUrl } from "@/src/utils/apiUrl";
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

export function useDashboardOverview() {
  const [data, setData] = useState<DashboardOverview>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, plansRes, modulesRes, subsRes, offersRes] =
        await Promise.all([
          fetch(apiUrl("/api/apps")),
          fetch(apiUrl("/api/plans")),
          fetch(apiUrl("/api/modules")),
          fetch(apiUrl("/api/subscriptions")),
          fetch(apiUrl("/api/offers")),
        ]);

      const [apps, plans, modules, subscriptions, offers] =
        await Promise.all([
          appsRes.ok ? appsRes.json() : [],
          plansRes.ok ? plansRes.json() : [],
          modulesRes.ok ? modulesRes.json() : [],
          subsRes.ok ? subsRes.json() : [],
          offersRes.ok ? offersRes.json() : [],
        ]);

      const subs: Subscription[] = subscriptions;
      const offs: Offer[] = offers;
      const plansList: Plan[] = plans;

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

      setData({
        apps: apps.length,
        appList: apps,
        plans: plans.length,
        modules: modules.filter((m: { deleted_at: string | null }) => !m.deleted_at)
          .length,
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
      });
    } catch {
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { data, loading, refetch: fetchOverview };
}
