import type { LifecycleStatus } from "../types";
import { prisma } from "@/src/shared/lib/prisma";

export type ModuleAccessAssignment = {
  app_id: number;
  status: LifecycleStatus | null;
  app_name: string | null;
  app_hash: string;
};

export async function getModuleAccessAssignments(
  moduleId: number,
): Promise<ModuleAccessAssignment[]> {
  const rows = await prisma.appModule.findMany({
    where: { module_id: moduleId },
    select: {
      app_id: true,
      status: true,
      app: {
        select: { name: true, hash: true, kind: true, deleted_at: true },
      },
    },
  });

  return rows
    .filter((r) => r.app.deleted_at == null && r.app.kind !== "template")
    .map((r) => ({
      app_id: r.app_id,
      status: r.status as LifecycleStatus | null,
      app_name: r.app.name,
      app_hash: r.app.hash,
    }));
}

export async function getModuleSectionIds(moduleId: number): Promise<number[]> {
  const sections = await prisma.section.findMany({
    where: { module_id: moduleId, deleted_at: null },
    select: { id: true },
    orderBy: { created_at: "asc" },
  });
  return sections.map((s) => s.id);
}

/** Overrides por sección para una app (null = hereda). Una sola query con IN. */
export async function getSectionOverridesForApp(
  appId: number,
  sectionIds: number[],
): Promise<Map<number, LifecycleStatus | null>> {
  const map = new Map<number, LifecycleStatus | null>(
    sectionIds.map((id) => [id, null]),
  );
  if (sectionIds.length === 0) return map;

  const rows = await prisma.appSection.findMany({
    where: {
      app_id: appId,
      section_id: { in: sectionIds },
      status: { not: null },
    },
    select: { section_id: true, status: true },
  });

  for (const row of rows) {
    map.set(row.section_id, row.status as LifecycleStatus);
  }
  return map;
}

export async function getModuleAccessPanelData(
  moduleId: number,
  appId?: number | null,
) {
  const [sectionIds, assignments] = await Promise.all([
    getModuleSectionIds(moduleId),
    getModuleAccessAssignments(moduleId),
  ]);

  const resolvedAppId =
    appId != null && Number.isFinite(appId)
      ? appId
      : (assignments[0]?.app_id ?? null);

  let section_overrides: Record<number, LifecycleStatus | null> | undefined;
  if (resolvedAppId != null) {
    const overrides = await getSectionOverridesForApp(
      resolvedAppId,
      sectionIds,
    );
    section_overrides = Object.fromEntries(overrides);
  }

  return {
    assignments,
    section_ids: sectionIds,
    section_overrides,
    selected_app_id: resolvedAppId,
  };
}
