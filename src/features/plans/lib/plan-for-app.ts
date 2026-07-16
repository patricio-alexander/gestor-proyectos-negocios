import type { Plan, PlanModule } from "../types";

/** IDs de apps con al menos un módulo configurado en el plan. */
export function getPlanAppIds(plan: Plan): number[] {
  if (plan.app_ids?.length) return plan.app_ids;
  return [...new Set(plan.plan_modules.map((m) => m.app_id))];
}

/** Módulos del plan configurados para una app concreta. */
export function getPlanModulesForApp(
  plan: Plan,
  appId: number,
): PlanModule[] {
  return plan.plan_modules.filter((m) => m.app_id === appId);
}

/** Planes que tienen al menos un módulo definido para la app. */
export function filterPlansForApp(plans: Plan[], appId: number): Plan[] {
  return plans.filter((plan) => getPlanModulesForApp(plan, appId).length > 0);
}

/** Apps desplegadas que forman parte del plan (tienen módulos configurados). */
export function filterDeploymentAppsForPlan<T extends { id: number }>(
  apps: T[],
  plan: Plan,
): T[] {
  const planAppIds = new Set(getPlanAppIds(plan));
  return apps.filter((app) => planAppIds.has(app.id));
}
