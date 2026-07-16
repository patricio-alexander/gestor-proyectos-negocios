import type { PlanModule } from "../types";

export type PlanModulesByApp = {
  app_id: number;
  app_name: string;
  modules: PlanModule[];
};

export function groupPlanModulesByApp(
  modules: PlanModule[],
): PlanModulesByApp[] {
  const byApp = new Map<number, PlanModulesByApp>();

  for (const mod of modules) {
    const existing = byApp.get(mod.app_id);
    if (existing) {
      existing.modules.push(mod);
      continue;
    }
    byApp.set(mod.app_id, {
      app_id: mod.app_id,
      app_name: mod.app_name?.trim() || `App #${mod.app_id}`,
      modules: [mod],
    });
  }

  return [...byApp.values()].sort((a, b) =>
    a.app_name.localeCompare(b.app_name, "es"),
  );
}
