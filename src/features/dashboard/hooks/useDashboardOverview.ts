"use client";

import { useQuery } from "@tanstack/react-query";
import type { Subscription } from "@/src/features/subscriptions/types";
import type { Offer } from "@/src/features/offers/types";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";
import { getDateRangeStatus, daysUntil } from "@/src/shared/utils/format-display";
import type { Plan } from "@/src/features/plans/types";
import type { App } from "@/src/features/apps/types";
import type {
  AppSyncHealthRow,
  AppSyncHealthState,
} from "@/src/features/apps/lib/probe-entitlement";

type SyncHealthResponse = {
  checked_at: string;
  results: AppSyncHealthRow[];
};

export type DashboardOverview = {
  apps: number;
  appList: App[];
  webApps: number;
  mobileApps: number;
  onlineDevices: number;
  plans: number;
  modules: number;
  syncHealth: Record<AppSyncHealthState, number>;
  syncByAppId: Record<number, AppSyncHealthRow>;
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
};

const EMPTY: DashboardOverview = {
  apps: 0,
  appList: [],
  webApps: 0,
  mobileApps: 0,
  onlineDevices: 0,
  plans: 0,
  modules: 0,
  syncHealth: { not_configured: 0, no_secret: 0, online: 0, offline: 0 },
  syncByAppId: {},
  subscriptions: { total: 0, active: 0, expired: 0, canceled: 0 },
  offers: { total: 0, active: 0, upcoming: 0, expired: 0 },
  recentSubscriptions: [],
  expiringSubscriptions: [],
  expiringOffers: [],
};

async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const [apps, plans, modules, subscriptions, offers, syncHealthResponse] =
    await Promise.all([
    fetchJson<App[]>("/api/apps"),
    fetchJson<Plan[]>("/api/plans?channel=web"),
    fetchJson<{ deleted_at: string | null }[]>("/api/modules"),
    fetchJson<Subscription[]>("/api/subscriptions"),
    fetchJson<Offer[]>("/api/offers"),
    fetchJson<SyncHealthResponse>("/api/apps/sync-health").catch(() => ({
      checked_at: "",
      results: [],
    })),
  ]);

  const subs = subscriptions;
  const offs = offers;
  const syncHealth: DashboardOverview["syncHealth"] = {
    not_configured: 0,
    no_secret: 0,
    online: 0,
    offline: 0,
  };
  const syncByAppId: DashboardOverview["syncByAppId"] = {};
  for (const result of syncHealthResponse.results) {
    syncHealth[result.state] += 1;
    syncByAppId[result.app_id] = result;
  }

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
    webApps: apps.filter((app) => app.kind !== "mobile").length,
    mobileApps: apps.filter((app) => app.kind === "mobile").length,
    onlineDevices: apps.reduce(
      (total, app) => total + (app.mobile?.online_device_count ?? 0),
      0,
    ),
    plans: plans.length,
    modules: modules.filter((m) => !m.deleted_at).length,
    syncHealth,
    syncByAppId,
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
