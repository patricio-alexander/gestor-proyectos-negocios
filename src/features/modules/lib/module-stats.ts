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
  let totalSections = 0;
  let limitedSections = 0;
  let activeModules = 0;

  for (const mod of modules) {
    if (!mod.is_maintainer) activeModules += 1;
    totalSections += mod.sections.length;
    limitedSections += mod.sections.filter(
      (s) => s.max_records_limit != null,
    ).length;
  }

  return {
    totalModules: modules.length,
    activeModules,
    totalSections,
    limitedSections,
    appsWithModules: 0,
    byApp: [],
  };
}

export function countLimitedSections(mod: Module) {
  return mod.sections.filter((s) => s.max_records_limit != null).length;
}
