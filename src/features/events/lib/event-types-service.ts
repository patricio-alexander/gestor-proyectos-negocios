import { EVENT_TYPES_SEED } from "@/prisma/event-types-seed";
import { prisma } from "@/src/shared/lib/prisma";
import type { EventTypeRecord } from "@/src/features/events/types";

const SEED_CATALOG_BY_KEY = new Map(EVENT_TYPES_SEED.map((entry) => [entry.key, entry]));

function mapType(row: {
  id: number;
  key: string;
  name: string;
  description: string | null;
  created_at: Date;
}): EventTypeRecord {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    created_at: row.created_at.toISOString(),
  };
}

export async function listEventTypes() {
  const rows = await prisma.eventType.findMany({
    orderBy: { name: "asc" },
  });
  return rows.map(mapType);
}

export async function createEventType(input: { key: string; name: string; description?: string }) {
  const row = await prisma.eventType.create({
    data: {
      key: input.key.trim(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
    },
  });
  return mapType(row);
}

export async function updateEventType(
  id: number,
  input: { key?: string; name?: string; description?: string },
) {
  const row = await prisma.eventType.update({
    where: { id },
    data: {
      ...(input.key != null ? { key: input.key.trim() } : {}),
      ...(input.name != null ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
    },
  });
  return mapType(row);
}

export async function deleteEventType(id: number) {
  const type = await prisma.eventType.findUnique({ where: { id } });
  if (!type) return null;
  await prisma.eventType.delete({ where: { id } });
  return type;
}

export async function getOrCreateEventTypeByKey(typeKey: string) {
  const key = typeKey.trim();
  const existing = await prisma.eventType.findUnique({ where: { key } });
  if (existing) {
    return { type: mapType(existing), created: false };
  }

  const fromSeed = SEED_CATALOG_BY_KEY.get(key);
  const row = await prisma.eventType.create({
    data: {
      key,
      name:
        fromSeed?.name ??
        key
          .split(/[.:_-]+/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
      description:
        fromSeed?.description ?? "Registrado automáticamente desde webhook de app",
    },
  });

  return { type: mapType(row), created: true };
}
