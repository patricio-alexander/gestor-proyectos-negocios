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
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

export async function createModule(input: CreateModuleInput) {
  const row = await prisma.module.create({
    data: {
      name: input.name.trim(),
      key: generateKey(input.name.trim()),
      business_id: input.business_id,
    },
  });
  return { id: row.id, name: row.name };
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
  return { id: row.id, name: row.name };
}

export async function deleteModule(id: number) {
  await prisma.module.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
}
