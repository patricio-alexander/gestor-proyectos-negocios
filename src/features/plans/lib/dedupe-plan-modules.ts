import type { PlanModule } from "../types";

export type DedupedPlanModule = {
  module_id: number;
  module_name: string;
  is_trial: boolean;
  app_names: string[];
};

/** Un módulo del catálogo puede estar en varias apps; en UI mostramos una sola fila. */
export function dedupePlanModulesByModuleId(
  modules: PlanModule[],
): DedupedPlanModule[] {
  const byModule = new Map<number, DedupedPlanModule>();

  for (const mod of modules) {
    const appName = mod.app_name?.trim() || `App #${mod.app_id}`;
    const existing = byModule.get(mod.module_id);
    if (existing) {
      if (!existing.app_names.includes(appName)) {
        existing.app_names.push(appName);
      }
      continue;
    }
    byModule.set(mod.module_id, {
      module_id: mod.module_id,
      module_name: mod.module_name,
      is_trial: mod.is_trial,
      app_names: [appName],
    });
  }

  return [...byModule.values()].sort((a, b) =>
    a.module_name.localeCompare(b.module_name, "es"),
  );
}
