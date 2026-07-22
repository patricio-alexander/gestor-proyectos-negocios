"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";
import type {
  AppSyncHealthRow,
  AppSyncHealthState,
} from "@/src/features/apps/lib/probe-entitlement";

type SyncHealthResponse = {
  checked_at: string;
  results: AppSyncHealthRow[];
};

async function fetchSyncHealth(): Promise<SyncHealthResponse> {
  return fetchJson<SyncHealthResponse>("/api/apps/sync-health");
}

export type AppLiveSyncState = AppSyncHealthState | "checking" | null;

export function useAppsSyncHealth(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.apps.syncHealth,
    queryFn: fetchSyncHealth,
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const byAppId = useMemo(() => {
    const map = new Map<number, AppSyncHealthRow>();
    for (const row of query.data?.results ?? []) {
      map.set(row.app_id, row);
    }
    return map;
  }, [query.data]);

  function liveStateFor(appId: number): AppLiveSyncState {
    const row = byAppId.get(appId);
    if (!row) {
      return query.isLoading || query.isFetching ? "checking" : null;
    }
    if (query.isFetching && !query.isFetchedAfterMount) return "checking";
    return row.state;
  }

  return {
    byAppId,
    liveStateFor,
    loading: query.isLoading,
    isFetching: query.isFetching,
    checkedAt: query.data?.checked_at ?? null,
    refetch: query.refetch,
  };
}
