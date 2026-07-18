"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventTypeRecord } from "@/src/features/events/types";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";

async function fetchEventTypes(): Promise<EventTypeRecord[]> {
  return fetchJson<EventTypeRecord[]>("/api/event-types");
}

export function useEventTypes() {
  const queryClient = useQueryClient();

  const typesQuery = useQuery({
    queryKey: queryKeys.eventTypes.list,
    queryFn: fetchEventTypes,
  });

  async function create(input: { key: string; name: string; description?: string }) {
    const type = await fetchJson<EventTypeRecord>("/api/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    queryClient.setQueryData<EventTypeRecord[]>(queryKeys.eventTypes.list, (current) =>
      current ? [...current, type] : [type],
    );

    return type;
  }

  async function remove(id: number) {
    await fetchJson(`/api/event-types/${id}`, { method: "DELETE" });

    queryClient.setQueryData<EventTypeRecord[]>(queryKeys.eventTypes.list, (current) =>
      current?.filter((t) => t.id !== id) ?? [],
    );
  }

  const refetch = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes.all });
  };

  return {
    types: typesQuery.data ?? [],
    loading: typesQuery.isLoading,
    create,
    remove,
    refetch,
  };
}
