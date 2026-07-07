import type { Module } from "../types";

export type ModuleStats = {
  totalModules: number;
  activeModules: number;
  totalSections: number;
  limitedSections: number;
  appsWithModules: number;
  byApp: { appName: string; moduleCount: number; sectionCount: number }[];
};

export function getModuleStats(modules: Module[]): ModuleStats {
  const appMap = new Map<
    string,
    { moduleCount: number; sectionCount: number }
  >();

  let totalSections = 0;
  let limitedSections = 0;
  let activeModules = 0;

  for (const mod of modules) {
    if (mod.is_active) activeModules += 1;

    const appName = mod.app_name || "Sin aplicación";
    const current = appMap.get(appName) ?? {
      moduleCount: 0,
      sectionCount: 0,
    };
    current.moduleCount += 1;
    current.sectionCount += mod.sections.length;
    appMap.set(appName, current);

    totalSections += mod.sections.length;
    limitedSections += mod.sections.filter(
      (s) => s.max_records_limit != null,
    ).length;
  }

  const byApp = [...appMap.entries()]
    .map(([appName, counts]) => ({ appName, ...counts }))
    .sort((a, b) => b.moduleCount - a.moduleCount);

  return {
    totalModules: modules.length,
    activeModules,
    totalSections,
    limitedSections,
    appsWithModules: appMap.size,
    byApp,
  };
}

export function countLimitedSections(mod: Module) {
  return mod.sections.filter((s) => s.max_records_limit != null).length;
}
