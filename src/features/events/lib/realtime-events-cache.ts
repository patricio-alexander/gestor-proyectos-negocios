import type { QueryClient } from "@tanstack/react-query";
import type { EventRecord } from "@/src/features/events/types";
import { queryKeys } from "@/src/shared/lib/query-keys";

const LIST_TAKE = 100;

type AppStats = {
  app_id: number;
  app_name: string;
  types: Array<{ type_name: string; count: number }>;
};

function eventMatchesRange(event: EventRecord, range?: string | null): boolean {
  if (!range || range === "TODO") return true;
  const days: Record<string, number> = { "1D": 1, "1S": 7, "1M": 30, "3M": 90 };
  const d = days[range];
  if (!d) return true;
  const cutoff = Date.now() - d * 24 * 60 * 60 * 1000;
  return new Date(event.created_at).getTime() >= cutoff;
}

function isEventsListQuery(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "events" && queryKey[1] === "list";
}

function isEventsStatsQuery(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "events" && queryKey[1] === "stats";
}

function listRangeFromKey(queryKey: readonly unknown[]): string | null {
  const params = queryKey[2];
  if (params && typeof params === "object" && "range" in params) {
    const range = (params as { range?: string | null }).range;
    return range ?? "TODO";
  }
  return "TODO";
}

function statsRangeFromKey(queryKey: readonly unknown[]): string | null {
  const params = queryKey[1] === "stats" ? queryKey[2] : null;
  if (params && typeof params === "object" && "range" in params) {
    const range = (params as { range?: string | null }).range;
    return range ?? "TODO";
  }
  return "TODO";
}

function prependToEventLists(queryClient: QueryClient, event: EventRecord) {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: queryKeys.events.all })) {
    if (!isEventsListQuery(query.queryKey)) continue;

    const range = listRangeFromKey(query.queryKey);
    if (!eventMatchesRange(event, range)) continue;

    queryClient.setQueryData<EventRecord[]>(query.queryKey, (current) => {
      if (!current) return current;
      if (current.some((row) => row.id === event.id)) return current;
      return [event, ...current].slice(0, LIST_TAKE);
    });
  }
}

function bumpEventStats(queryClient: QueryClient, event: EventRecord) {
  const typeName = event.type?.name;
  if (!typeName) return;

  for (const query of queryClient.getQueryCache().findAll({ queryKey: queryKeys.events.all })) {
    if (!isEventsStatsQuery(query.queryKey)) continue;

    const range = statsRangeFromKey(query.queryKey);
    if (!eventMatchesRange(event, range)) continue;

    queryClient.setQueryData<AppStats[]>(query.queryKey, (current) => {
      if (!current) return current;

      const next = current.map((app) => ({
        ...app,
        types: app.types.map((t) => ({ ...t })),
      }));

      let appRow = next.find((app) => app.app_id === event.app_id);
      if (!appRow) {
        appRow = {
          app_id: event.app_id,
          app_name: `App #${event.app_id}`,
          types: [{ type_name: typeName, count: 1 }],
        };
        next.push(appRow);
        return next;
      }

      const typeRow = appRow.types.find((t) => t.type_name === typeName);
      if (typeRow) {
        typeRow.count += 1;
      } else {
        appRow.types.push({ type_name: typeName, count: 1 });
      }

      return next;
    });
  }
}

/** Inserta un evento recién creado en el cache de TanStack Query (sin refetch). */
export function applyRealtimeEvent(queryClient: QueryClient, event: EventRecord) {
  prependToEventLists(queryClient, event);
  bumpEventStats(queryClient, event);
}

export function invalidateEventStats(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.events.all,
    predicate: (query) => isEventsStatsQuery(query.queryKey),
  });
}
