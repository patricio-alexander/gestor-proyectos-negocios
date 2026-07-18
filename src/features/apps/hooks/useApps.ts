"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { App, CreateAppInput, UpdateAppInput } from "../types";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";

async function fetchApps(): Promise<App[]> {
  return fetchJson<App[]>("/api/apps");
}

export function useApps() {
  const queryClient = useQueryClient();

  const appsQuery = useQuery({
    queryKey: queryKeys.apps.list,
    queryFn: fetchApps,
  });

  const apps = useMemo(
    () => (appsQuery.data ?? []).filter((app) => !app.deleted_at),
    [appsQuery.data],
  );

  const invalidateApps = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.apps.all });

  async function create(input: CreateAppInput) {
    const app = await fetchJson<App>("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    queryClient.setQueryData<App[]>(queryKeys.apps.list, (current) =>
      current ? [app, ...current] : [app],
    );
    return app;
  }

  async function update(id: number, input: UpdateAppInput) {
    const app = await fetchJson<App>(`/api/apps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    queryClient.setQueryData<App[]>(queryKeys.apps.list, (current) =>
      current?.map((item) => (item.id === id ? app : item)) ?? [app],
    );
    return app;
  }

  async function remove(id: number) {
    await fetchJson(`/api/apps/${id}`, { method: "DELETE" });

    queryClient.setQueryData<App[]>(queryKeys.apps.list, (current) =>
      current?.map((item) =>
        item.id === id
          ? { ...item, deleted_at: new Date().toISOString() }
          : item,
      ) ?? [],
    );
  }

  async function pushEntitlement(id: number) {
    return fetchJson<{
      push_ok?: boolean;
      push_skipped?: boolean;
      push_error?: string | null;
      ok?: boolean;
      skipped?: boolean;
      error?: string;
    }>(`/api/apps/${id}/push-entitlement`, { method: "POST" });
  }

  async function updateModules(appId: number, moduleIds: number[]) {
    const data = await fetchJson<{
      ok?: boolean;
      modules_count?: number;
      push_ok?: boolean;
      push_skipped?: boolean;
      push_error?: string | null;
    }>(`/api/apps/${appId}/modules`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_ids: moduleIds }),
    });

    await Promise.all([
      invalidateApps(),
      queryClient.invalidateQueries({ queryKey: queryKeys.kanban.all }),
    ]);

    return data;
  }

  async function enablePlan(input: {
    app_id: number;
    plan_id: number;
    period?: "MONTHLY" | "ANNUALLY";
    replace?: boolean;
  }) {
    const data = await fetchJson<{
      plan_name?: string | null;
      period?: string;
      push_ok?: boolean;
      push_skipped?: boolean;
      push_error?: string | null;
    }>("/api/subscriptions/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: input.app_id,
        plan_id: input.plan_id,
        period: input.period ?? "MONTHLY",
        replace: input.replace ?? true,
      }),
    });

    await invalidateApps();
    return data;
  }

  return {
    apps,
    loading: appsQuery.isLoading,
    isFetching: appsQuery.isFetching,
    create,
    update,
    remove,
    pushEntitlement,
    enablePlan,
    updateModules,
    refetch: appsQuery.refetch,
  };
}
