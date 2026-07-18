"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateEventInput, EventRecord } from "@/src/features/events/types";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";
import { useRealtimeStatus } from "@/src/shared/providers/RealtimeProvider";

type AppStats = {
  app_id: number;
  app_name: string;
  types: Array<{ type_name: string; count: number }>;
};

type EventsStatsResponse = {
  apps?: AppStats[];
};

async function fetchEvents(range: string): Promise<EventRecord[]> {
  return fetchJson<EventRecord[]>(`/api/events?range=${encodeURIComponent(range)}`);
}

async function fetchEventsStats(range: string): Promise<AppStats[]> {
  const data = await fetchJson<EventsStatsResponse>(
    `/api/events/stats?range=${encodeURIComponent(range)}`,
  );
  return data.apps ?? [];
}

export function useEvents(range: string = "TODO") {
  const queryClient = useQueryClient();
  const realtimeStatus = useRealtimeStatus();
  const pollFallback = realtimeStatus !== "connected";

  const eventsQuery = useQuery({
    queryKey: queryKeys.events.list(undefined, range),
    queryFn: () => fetchEvents(range),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchInterval: pollFallback ? 4_000 : false,
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.events.stats(range),
    queryFn: () => fetchEventsStats(range),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchInterval: pollFallback ? 4_000 : false,
  });

  async function create(input: CreateEventInput) {
    const event = await fetchJson<EventRecord>("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    queryClient.setQueryData<EventRecord[]>(
      queryKeys.events.list(undefined, range),
      (current) => (current ? [event, ...current] : [event]),
    );
    void queryClient.invalidateQueries({ queryKey: queryKeys.events.stats(range) });

    return event;
  }

  const refetch = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
  };

  return {
    events: eventsQuery.data ?? [],
    apps: statsQuery.data ?? [],
    loading: eventsQuery.isPending || statsQuery.isPending,
    isFetching: eventsQuery.isFetching || statsQuery.isFetching,
    create,
    refetch,
  };
}
