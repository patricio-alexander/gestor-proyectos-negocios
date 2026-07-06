import { prisma } from "@/src/shared/lib/prisma";
import type {
  ModuleRecord,
  CreateModuleInput,
  UpdateModuleInput,
} from "../types";

function generateKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function listModules(): Promise<ModuleRecord[]> {
  const rows = await prisma.module.findMany({
    where: { deleted_at: null },
    orderBy: { id: "asc" },
  });
  return rows.map((r) => ({ id: r.id, name: r.name, app_id: r.app_id }));
}

export async function createModule(input: CreateModuleInput) {
  const row = await prisma.module.create({
    data: {
      name: input.name.trim(),
      key: generateKey(input.name.trim()),
      app_id: input.app_id,
    },
  });
  return { id: row.id, name: row.name, app_id: row.app_id };
}

export async function updateModule(id: number, input: UpdateModuleInput) {
  const row = await prisma.module.update({
    where: { id },
    data: {
      ...(input.name != null
        ? { name: input.name.trim(), key: generateKey(input.name.trim()) }
        : {}),
    },
  });
  return { id: row.id, name: row.name, app_id: row.app_id };
}

export async function deleteModule(id: number) {
  await prisma.module.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
}
