import type { Prisma } from "../../../../prisma/generated/prisma/client";

type DbClient = Prisma.TransactionClient | Prisma.DefaultPrismaClient;

/** Resuelve (app_id, module_id) → AppModule.id, creando la fila si no existe. */
export async function ensureAppModuleId(
  db: DbClient,
  appId: number,
  moduleId: number,
): Promise<number> {
  const row = await db.appModule.upsert({
    where: {
      app_id_module_id: { app_id: appId, module_id: moduleId },
    },
    update: {},
    create: { app_id: appId, module_id: moduleId },
    select: { id: true },
  });
  return row.id;
}

/** Reemplaza los módulos de app incluidos en un plan. */
export async function syncPlanAppModules(
  db: DbClient,
  planId: number,
  appIds: number[],
  moduleIds: number[],
) {
  await db.planAppModule.deleteMany({ where: { plan_id: planId } });
  if (appIds.length === 0 || moduleIds.length === 0) return;

  const rows: { plan_id: number; app_module_id: number }[] = [];
  for (const appId of appIds) {
    for (const moduleId of moduleIds) {
      const appModuleId = await ensureAppModuleId(db, appId, moduleId);
      rows.push({ plan_id: planId, app_module_id: appModuleId });
    }
  }

  if (rows.length > 0) {
    await db.planAppModule.createMany({ data: rows, skipDuplicates: true });
  }
}

/** Quita del plan los módulos de apps que no están en la lista permitida. */
export async function removePlanModulesForAppsNotIn(
  db: DbClient,
  planId: number,
  allowedAppIds: number[],
) {
  if (allowedAppIds.length === 0) return;

  const rows = await db.planAppModule.findMany({
    where: { plan_id: planId },
    select: {
      app_module_id: true,
      app_module: { select: { app_id: true } },
    },
  });

  const allowed = new Set(allowedAppIds);
  const toRemove = rows
    .filter((row) => !allowed.has(row.app_module.app_id))
    .map((row) => row.app_module_id);

  if (toRemove.length === 0) return;

  await db.planAppModule.deleteMany({
    where: {
      plan_id: planId,
      app_module_id: { in: toRemove },
    },
  });
}

/** Reemplaza los módulos de una app concreta en un plan (conserva otras apps). */
export async function replacePlanAppModulesForApp(
  db: DbClient,
  planId: number,
  appId: number,
  moduleIds: number[],
) {
  const appModuleRows = await db.appModule.findMany({
    where: { app_id: appId },
    select: { id: true },
  });
  const appModuleIds = appModuleRows.map((row) => row.id);

  if (appModuleIds.length > 0) {
    await db.planAppModule.deleteMany({
      where: {
        plan_id: planId,
        app_module_id: { in: appModuleIds },
      },
    });
  }

  if (moduleIds.length === 0) return;

  const rows: { plan_id: number; app_module_id: number }[] = [];
  for (const moduleId of moduleIds) {
    const appModuleId = await ensureAppModuleId(db, appId, moduleId);
    rows.push({ plan_id: planId, app_module_id: appModuleId });
  }

  await db.planAppModule.createMany({ data: rows, skipDuplicates: true });
}
