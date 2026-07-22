import {
  deriveModuleEffectiveStatus,
  effectiveSectionStatusForApp,
  normalizeLifecycleStatus,
} from "@/src/shared/lib/lifecycle-status-resolve";
import { prisma } from "@/src/shared/lib/prisma";
import type { KanbanBoardData, KanbanModule, KanbanSection } from "../types";
import type { LifecycleStatus } from "@/src/features/modules/types";

type ModuleRow = {
  id: number;
  name: string;
  key: string;
  status: LifecycleStatus;
  sections: {
    id: number;
    name: string;
    key: string | null;
    status: LifecycleStatus;
  }[];
};

function mapSectionForApp(
  section: ModuleRow["sections"][number],
  appModuleOverride: LifecycleStatus | null,
  appSectionStatus: LifecycleStatus | null | undefined,
  assigned: boolean,
): KanbanSection {
  const globalStatus = normalizeLifecycleStatus(section.status);
  const appStatusOverride =
    appSectionStatus != null ? normalizeLifecycleStatus(appSectionStatus) : null;

  return {
    id: section.id,
    name: section.name,
    key: section.key,
    globalStatus,
    appStatusOverride,
    assigned,
    effectiveStatus: effectiveSectionStatusForApp(
      globalStatus,
      appStatusOverride,
      appModuleOverride,
    ),
  };
}

function mapSectionCatalog(
  section: ModuleRow["sections"][number],
): KanbanSection {
  const globalStatus = normalizeLifecycleStatus(section.status);
  return {
    id: section.id,
    name: section.name,
    key: section.key,
    globalStatus,
    appStatusOverride: null,
    assigned: false,
    effectiveStatus: globalStatus,
  };
}

function mapModuleForApp(
  module: ModuleRow,
  appModuleOverride: LifecycleStatus | null,
  appSections: Map<number, LifecycleStatus | null>,
): KanbanModule {
  const globalStatus = normalizeLifecycleStatus(module.status);
  const moduleAppOverride =
    appModuleOverride != null
      ? normalizeLifecycleStatus(appModuleOverride)
      : null;

  const sections = module.sections.map((section) =>
    mapSectionForApp(
      section,
      moduleAppOverride,
      appSections.get(section.id),
      appSections.has(section.id),
    ),
  );

  return {
    id: module.id,
    name: module.name,
    key: module.key,
    globalStatus,
    appStatusOverride: moduleAppOverride,
    effectiveStatus: deriveModuleEffectiveStatus(
      globalStatus,
      moduleAppOverride,
      sections.map((s) => s.effectiveStatus),
    ),
    sections,
  };
}

function mapModuleCatalog(module: ModuleRow): KanbanModule {
  const globalStatus = normalizeLifecycleStatus(module.status);
  const sections = module.sections.map(mapSectionCatalog);

  return {
    id: module.id,
    name: module.name,
    key: module.key,
    globalStatus,
    appStatusOverride: null,
    effectiveStatus: deriveModuleEffectiveStatus(
      globalStatus,
      null,
      sections.map((s) => s.effectiveStatus),
    ),
    sections,
  };
}

export async function getKanbanBoardData(): Promise<KanbanBoardData> {
  const [apps, allModules] = await Promise.all([
    prisma.apps.findMany({
      where: { deleted_at: null, kind: { not: "mobile" } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        kind: true,
        app_modules: {
          where: {
            module: { deleted_at: null, channel: "web" },
          },
          select: {
            status: true,
            module: {
              select: {
                id: true,
                name: true,
                key: true,
                status: true,
                sections: {
                  where: { deleted_at: null },
                  orderBy: { name: "asc" },
                  select: {
                    id: true,
                    name: true,
                    key: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        app_sections: {
          select: { section_id: true, status: true },
        },
      },
    }),
    prisma.module.findMany({
      where: { deleted_at: null, channel: "web" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        key: true,
        status: true,
        sections: {
          where: { deleted_at: null },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            key: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const appColumns = apps.map((app) => {
    const appSectionMap = new Map<number, LifecycleStatus | null>(
      app.app_sections.map((row) => [row.section_id, row.status]),
    );

    const modules = app.app_modules
      .map((row) =>
        mapModuleForApp(row.module, row.status, appSectionMap),
      )
      .filter((module) => module != null);

    return {
      id: app.id,
      name: app.name,
      kind: app.kind,
      modules,
    };
  });

  const catalog_modules = allModules.map(mapModuleCatalog);

  return {
    apps: appColumns,
    catalog_modules,
  };
}
