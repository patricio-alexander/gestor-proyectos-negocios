/**
 * Catálogo planes channel=mobile: Gratis, Pro, Socios (mismos módulos).
 * Soft-deletea ChilePan* y restaura planes web si se pisaron por error.
 *
 *   npx tsx scripts/ensure-mobile-plans.ts
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/generated/prisma/client.js";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "localhost",
  user: process.env.DATABASE_USER ?? "root",
  password: process.env.DATABASE_PASSWORD ?? "",
  database: process.env.DATABASE_NAME ?? "raptorsolutions",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  connectionLimit: 1,
});

const prisma = new PrismaClient({ adapter });

const MOBILE_PLANS = [
  {
    name: "Plan Gratis",
    sortOrder: 1,
    monthlyPrice: 0,
    legacy: ["ChilePan Prueba"],
  },
  {
    name: "Plan Pro",
    sortOrder: 2,
    monthlyPrice: 69,
    legacy: ["ChilePan Básico", "ChilePan Taller", "ChilePan Comercio"],
  },
  {
    name: "Plan Socios",
    sortOrder: 3,
    monthlyPrice: 99,
    legacy: ["ChilePan Redes", "ChilePan Empresarial"],
  },
] as const;

const CHILEPAN_OBSOLETE = [
  "ChilePan Prueba",
  "ChilePan Básico",
  "ChilePan Taller",
  "ChilePan Comercio",
  "ChilePan Redes",
  "ChilePan Empresarial",
];

async function main() {
  const mobileApps = await prisma.apps.findMany({
    where: { deleted_at: null, kind: "mobile" },
    select: { id: true, name: true },
  });
  if (mobileApps.length === 0) {
    throw new Error("No hay apps kind=mobile");
  }

  const modules = await prisma.module.findMany({
    where: { deleted_at: null, channel: "mobile" },
    select: { id: true },
  });
  if (modules.length === 0) {
    throw new Error(
      "No hay módulos channel=mobile. Corré seed-chilepan-mobile-catalog primero (módulos).",
    );
  }

  const targetAppModuleIds: number[] = [];
  for (const app of mobileApps) {
    for (const mod of modules) {
      const am = await prisma.appModule.upsert({
        where: {
          app_id_module_id: { app_id: app.id, module_id: mod.id },
        },
        update: {},
        create: { app_id: app.id, module_id: mod.id },
      });
      targetAppModuleIds.push(am.id);
    }
  }
  const targetSet = new Set(targetAppModuleIds);

  console.log(
    `Apps móvil: ${mobileApps.map((a) => a.name).join(", ")} · vínculos: ${targetAppModuleIds.length}`,
  );

  for (const def of MOBILE_PLANS) {
    let plan = await prisma.plan.findFirst({
      where: { name: def.name, channel: "mobile", deleted_at: null },
    });

    if (!plan) {
      plan = await prisma.plan.findFirst({
        where: {
          channel: "mobile",
          name: { in: [...def.legacy] },
          deleted_at: null,
        },
      });
      if (plan) {
        plan = await prisma.plan.update({
          where: { id: plan.id },
          data: {
            name: def.name,
            sort_order: def.sortOrder,
            channel: "mobile",
            deleted_at: null,
          },
        });
        console.log(`~ renombrado → ${def.name}`);
      }
    }

    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: def.name,
          sort_order: def.sortOrder,
          channel: "mobile",
        },
      });
      console.log(`+ creado ${def.name}`);
    } else {
      plan = await prisma.plan.update({
        where: { id: plan.id },
        data: {
          name: def.name,
          sort_order: def.sortOrder,
          channel: "mobile",
          deleted_at: null,
        },
      });
      console.log(`~ actualizado ${def.name}`);
    }

    for (const appModuleId of targetAppModuleIds) {
      await prisma.planAppModule.upsert({
        where: {
          plan_id_app_module_id: {
            plan_id: plan.id,
            app_module_id: appModuleId,
          },
        },
        update: {},
        create: { plan_id: plan.id, app_module_id: appModuleId },
      });
    }

    const existing = await prisma.planAppModule.findMany({
      where: { plan_id: plan.id },
      select: { plan_id: true, app_module_id: true },
    });
    for (const row of existing) {
      if (!targetSet.has(row.app_module_id)) {
        await prisma.planAppModule.delete({
          where: {
            plan_id_app_module_id: {
              plan_id: row.plan_id,
              app_module_id: row.app_module_id,
            },
          },
        });
      }
    }

    for (const period of ["MONTHLY", "ANNUALLY"] as const) {
      const price =
        period === "MONTHLY" ? def.monthlyPrice : def.monthlyPrice * 10;
      const row = await prisma.planPrice.findFirst({
        where: { plan_id: plan.id, period },
      });
      if (!row) {
        await prisma.planPrice.create({
          data: { plan_id: plan.id, period, price },
        });
      } else {
        await prisma.planPrice.update({
          where: { id: row.id },
          data: { price },
        });
      }
    }
  }

  const obsolete = await prisma.plan.updateMany({
    where: {
      deleted_at: null,
      channel: "mobile",
      name: { in: [...CHILEPAN_OBSOLETE] },
    },
    data: { deleted_at: new Date() },
  });
  console.log(`soft-delete ChilePan* restantes: ${obsolete.count}`);

  // --- Restaurar catálogo web (revertir error Gratis/Pro/Socios en web) ---
  const webGratis = await prisma.plan.findFirst({
    where: { name: "Plan Gratis", channel: "web", deleted_at: null },
  });
  if (webGratis) {
    await prisma.plan.update({
      where: { id: webGratis.id },
      data: { name: "Plan Prueba", sort_order: 1 },
    });
    console.log("web: Plan Gratis → Plan Prueba");
  }

  for (const [name, sort] of [
    ["Plan Básico", 2],
    ["Plan Medio", 3],
    ["Plan Empresarial", 6],
    ["Plan Prueba", 1],
  ] as const) {
    const restored = await prisma.plan.updateMany({
      where: { channel: "web", name, deleted_at: { not: null } },
      data: { deleted_at: null, sort_order: sort },
    });
    if (restored.count) console.log(`web restaurado: ${name}`);
  }

  await prisma.plan.updateMany({
    where: { channel: "web", name: "Plan Pro", deleted_at: null },
    data: { sort_order: 4 },
  });
  await prisma.plan.updateMany({
    where: { channel: "web", name: "Plan Socios", deleted_at: null },
    data: { sort_order: 5 },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
