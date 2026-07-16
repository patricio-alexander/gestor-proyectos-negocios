/**
 * Crea la app plantilla Raptor y mueve planes/ofertas desde EdDeli (u otras).
 * Uso (tras migrate deploy): npx tsx scripts/migrate-catalog-to-raptor.ts
 */
import "dotenv/config";
import crypto from "crypto";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 1,
});

const prisma = new PrismaClient({ adapter });

const RAPTOR_APP_HASH = crypto
  .createHash("sha256")
  .update("raptor-template-app")
  .digest("hex")
  .slice(0, 32);

async function main() {
  const raptor = await prisma.apps.upsert({
    where: { hash: RAPTOR_APP_HASH },
    update: {
      name: "Raptor",
      kind: "template",
      deleted_at: null,
      entitlement_url: null,
      entitlement_secret: null,
    },
    create: {
      hash: RAPTOR_APP_HASH,
      name: "Raptor",
      owner_name: "Raptor",
      email: "soporte@raptor.local",
      kind: "template",
    },
  });

  const sources = await prisma.apps.findMany({
    where: { id: { not: raptor.id }, deleted_at: null },
    select: { id: true, name: true },
  });

  let movedPlanModules = 0;
  let movedOffers = 0;

  for (const src of sources) {
    const planAppModules = await prisma.planAppModule.findMany({
      where: { app_module: { app_id: src.id } },
      include: { app_module: { select: { module_id: true } } },
    });

    for (const pam of planAppModules) {
      const templateAppModule = await prisma.appModule.upsert({
        where: {
          app_id_module_id: {
            app_id: raptor.id,
            module_id: pam.app_module.module_id,
          },
        },
        update: {},
        create: {
          app_id: raptor.id,
          module_id: pam.app_module.module_id,
        },
      });

      await prisma.planAppModule.upsert({
        where: {
          plan_id_app_module_id: {
            plan_id: pam.plan_id,
            app_module_id: templateAppModule.id,
          },
        },
        update: {},
        create: {
          plan_id: pam.plan_id,
          app_module_id: templateAppModule.id,
        },
      });
      movedPlanModules++;
    }

    await prisma.planAppModule.deleteMany({
      where: { app_module: { app_id: src.id } },
    });

    const o = await prisma.offer.updateMany({
      where: { app_id: src.id, deleted_at: null },
      data: { app_id: raptor.id },
    });
    movedOffers += o.count;
  }

  await prisma.apps.updateMany({
    where: { id: { not: raptor.id }, deleted_at: null },
    data: { kind: "deployment" },
  });

  console.log(
    `OK: Raptor #${raptor.id} = template. ${movedPlanModules} vínculos plan-módulo, ${movedOffers} ofertas migrados. Other apps = deployment.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
