import { prisma } from "@/src/shared/lib/prisma";
import type { Prisma } from "@/prisma/generated/prisma/client";
import type {
  CreateEventInput,
  EventRecord,
  EventSource,
} from "@/src/features/events/types";
import { getOrCreateEventTypeByKey } from "./event-types-service";

function mapEvent(row: {
  id: number;
  app_id: number;
  type_id: number;
  name: string;
  metadata: unknown;
  source: EventSource;
  created_at: Date;
  type?: {
    id: number;
    key: string;
    name: string;
    description: string | null;
    created_at: Date;
  };
}): EventRecord {
  return {
    id: row.id,
    app_id: row.app_id,
    type_id: row.type_id,
    name: row.name,
    metadata: row.metadata as Record<string, unknown> | null,
    source: row.source,
    created_at: row.created_at.toISOString(),
    ...(row.type
      ? {
          type: {
            id: row.type.id,
            key: row.type.key,
            name: row.type.name,
            description: row.type.description,
            created_at: row.type.created_at.toISOString(),
          },
        }
      : {}),
  };
}

function getDateFilter(range?: string): { gte?: Date } | undefined {
  if (!range || range === "TODO") return undefined;
  const days: Record<string, number> = { "1D": 1, "1S": 7, "1M": 30, "3M": 90 };
  const d = days[range];
  if (!d) return undefined;
  return { gte: new Date(Date.now() - d * 24 * 60 * 60 * 1000) };
}

export async function listEvents(appId?: number, range?: string) {
  const rows = await prisma.event.findMany({
    where: {
      ...(appId ? { app_id: appId } : {}),
      ...(getDateFilter(range) ? { created_at: getDateFilter(range) } : {}),
    },
    include: { type: true },
    orderBy: { created_at: "desc" },
    take: 100,
  });
  return rows.map(mapEvent);
}

export async function createEvent(input: CreateEventInput) {
  const { type } = await getOrCreateEventTypeByKey(input.type_key.trim());

  const row = await prisma.event.create({
    data: {
      app_id: input.app_id,
      type_id: type.id,
      name: input.name.trim(),
      source: input.source ?? "api",
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
    include: { type: true },
  });
  return mapEvent(row);
}

export async function getEventById(id: number) {
  const row = await prisma.event.findUnique({
    where: { id },
    include: { type: true },
  });
  return row ? mapEvent(row) : null;
}

type AppTypeStats = {
  app_id: number;
  app_name: string;
  types: Array<{ type_name: string; count: number }>;
};

export async function eventsByAppWithTypes(range?: string): Promise<AppTypeStats[]> {
  const dateFilter = getDateFilter(range);
  const where = dateFilter ? { created_at: dateFilter } : undefined;

  const events = await prisma.event.findMany({
    where,
    select: { app_id: true, type: { select: { name: true } } },
  });

  const appMap = new Map<number, Map<string, number>>();
  for (const e of events) {
    if (!appMap.has(e.app_id)) appMap.set(e.app_id, new Map());
    const typeMap = appMap.get(e.app_id)!;
    typeMap.set(e.type.name, (typeMap.get(e.type.name) ?? 0) + 1);
  }

  const appIds = [...appMap.keys()];
  const apps = appIds.length
    ? await prisma.apps.findMany({
        where: { id: { in: appIds } },
        select: { id: true, name: true },
      })
    : [];

  const nameMap = new Map(apps.map((a) => [a.id, a.name ?? `App #${a.id}`]));

  return [...appMap.entries()].map(([app_id, typeMap]) => ({
    app_id,
    app_name: nameMap.get(app_id) ?? `App #${app_id}`,
    types: [...typeMap.entries()]
      .map(([type_name, count]) => ({ type_name, count }))
      .sort((a, b) => b.count - a.count),
  }));
}
