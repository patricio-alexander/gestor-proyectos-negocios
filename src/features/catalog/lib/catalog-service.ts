import { prisma } from "@/src/shared/lib/prisma";
import type {
  AppModuleRecord,
  AppSectionRecord,
  CreateAppModuleInput,
  CreateAppSectionInput,
  UpdateAppModuleInput,
  UpdateAppSectionInput,
} from "../types";

function mapSection(row: {
  id: number;
  app_module_id: number;
  key: string;
  name: string;
  route_path: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}): AppSectionRecord {
  return {
    id: row.id,
    app_module_id: row.app_module_id,
    key: row.key,
    name: row.name,
    route_path: row.route_path,
    description: row.description,
    sort_order: row.sort_order,
    is_active: row.is_active,
  };
}

function mapModule(row: {
  id: number;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  app_target: string;
  is_active: boolean;
  sections: Parameters<typeof mapSection>[0][];
}): AppModuleRecord {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    icon: row.icon,
    sort_order: row.sort_order,
    app_target: row.app_target,
    is_active: row.is_active,
    sections: row.sections.map(mapSection),
  };
}

const moduleInclude = {
  sections: {
    where: { deleted_at: null },
    orderBy: { sort_order: "asc" as const },
  },
};

export async function listAppModules(): Promise<AppModuleRecord[]> {
  const rows = await prisma.appModule.findMany({
    where: { deleted_at: null },
    include: moduleInclude,
    orderBy: { sort_order: "asc" },
  });
  return rows.map(mapModule);
}

export async function createAppModule(input: CreateAppModuleInput) {
  const row = await prisma.appModule.create({
    data: {
      key: input.key.trim(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      icon: input.icon?.trim() || null,
      sort_order: input.sort_order ?? 0,
    },
    include: moduleInclude,
  });
  return mapModule(row);
}

export async function updateAppModule(id: number, input: UpdateAppModuleInput) {
  const row = await prisma.appModule.update({
    where: { id },
    data: {
      ...(input.key != null ? { key: input.key.trim() } : {}),
      ...(input.name != null ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.icon !== undefined ? { icon: input.icon?.trim() || null } : {}),
      ...(input.sort_order != null ? { sort_order: input.sort_order } : {}),
      ...(input.is_active != null ? { is_active: input.is_active } : {}),
    },
    include: moduleInclude,
  });
  return mapModule(row);
}

export async function deleteAppModule(id: number) {
  await prisma.appModule.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
  });
}

export async function createAppSection(input: CreateAppSectionInput) {
  const row = await prisma.appSection.create({
    data: {
      app_module_id: input.app_module_id,
      key: input.key.trim(),
      name: input.name.trim(),
      route_path: input.route_path?.trim() || null,
      description: input.description?.trim() || null,
      sort_order: input.sort_order ?? 0,
    },
  });
  return mapSection(row);
}

export async function updateAppSection(id: number, input: UpdateAppSectionInput) {
  const row = await prisma.appSection.update({
    where: { id },
    data: {
      ...(input.key != null ? { key: input.key.trim() } : {}),
      ...(input.name != null ? { name: input.name.trim() } : {}),
      ...(input.route_path !== undefined ? { route_path: input.route_path?.trim() || null } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.sort_order != null ? { sort_order: input.sort_order } : {}),
      ...(input.is_active != null ? { is_active: input.is_active } : {}),
    },
  });
  return mapSection(row);
}

export async function deleteAppSection(id: number) {
  await prisma.appSection.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
  });
}
