import { prisma } from "@/src/shared/lib/prisma";
import type { Prisma } from "@/prisma/generated/prisma/client";
import type {
  CreateEventInput,
  EventRecord,
  EventSource,
} from "@/src/features/events/types";
import { getOrCreateEventTypeByKey } from "./event-types-service";
import { resolveEventModuleHit } from "./event-module-map";

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

export type ModuleSectionStats = {
  app_id: number;
  app_name: string;
  modules: Array<{
    module_key: string;
    module_name: string;
    count: number;
    sections: Array<{
      section_key: string;
      section_name: string;
      count: number;
    }>;
  }>;
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

/**
 * Actividad por módulo/sección a partir de los eventos webhook ya recibidos
 * (type_key + path en metadata → catálogo EdDeli).
 */
export async function eventsByModuleAndSection(
  range?: string,
): Promise<ModuleSectionStats[]> {
  const dateFilter = getDateFilter(range);
  const events = await prisma.event.findMany({
    where: dateFilter ? { created_at: dateFilter } : undefined,
    select: {
      app_id: true,
      metadata: true,
      type: { select: { key: true } },
    },
  });

  type SectionBucket = { section_key: string; section_name: string; count: number };
  type ModuleBucket = {
    module_key: string;
    module_name: string;
    count: number;
    sections: Map<string, SectionBucket>;
  };

  const appMap = new Map<number, Map<string, ModuleBucket>>();

  for (const e of events) {
    const meta =
      e.metadata && typeof e.metadata === "object" && !Array.isArray(e.metadata)
        ? (e.metadata as Record<string, unknown>)
        : null;
    const hit = resolveEventModuleHit(e.type?.key, meta);
    if (!hit) continue;

    if (!appMap.has(e.app_id)) appMap.set(e.app_id, new Map());
    const modules = appMap.get(e.app_id)!;
    if (!modules.has(hit.module_key)) {
      modules.set(hit.module_key, {
        module_key: hit.module_key,
        module_name: hit.module_name,
        count: 0,
        sections: new Map(),
      });
    }
    const mod = modules.get(hit.module_key)!;
    mod.count += 1;

    if (!mod.sections.has(hit.section_key)) {
      mod.sections.set(hit.section_key, {
        section_key: hit.section_key,
        section_name: hit.section_name,
        count: 0,
      });
    }
    mod.sections.get(hit.section_key)!.count += 1;
  }

  const appIds = [...appMap.keys()];
  const apps = appIds.length
    ? await prisma.apps.findMany({
        where: { id: { in: appIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameMap = new Map(apps.map((a) => [a.id, a.name ?? `App #${a.id}`]));

  return [...appMap.entries()]
    .map(([app_id, modules]) => ({
      app_id,
      app_name: nameMap.get(app_id) ?? `App #${app_id}`,
      modules: [...modules.values()]
        .map((m) => ({
          module_key: m.module_key,
          module_name: m.module_name,
          count: m.count,
          sections: [...m.sections.values()].sort((a, b) => b.count - a.count),
        }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => {
      const ta = a.modules.reduce((s, m) => s + m.count, 0);
      const tb = b.modules.reduce((s, m) => s + m.count, 0);
      return tb - ta;
    });
}
