/**
 * Crea la app plantilla Raptor y mueve módulos/planes/ofertas desde EdDeli (u otras).
 * Uso (tras migrate deploy): npx tsx scripts/migrate-catalog-to-raptor.ts
 */
import "dotenv/config";
import crypto from "crypto";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/generated/prisma/client.ts";

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

  let movedModules = 0;
  let movedPlans = 0;
  let movedOffers = 0;

  for (const src of sources) {
    const m = await prisma.module.updateMany({
      where: { app_id: src.id, deleted_at: null },
      data: { app_id: raptor.id },
    });
    const p = await prisma.plan.updateMany({
      where: { app_id: src.id, deleted_at: null },
      data: { app_id: raptor.id },
    });
    const o = await prisma.offer.updateMany({
      where: { app_id: src.id, deleted_at: null },
      data: { app_id: raptor.id },
    });
    movedModules += m.count;
    movedPlans += p.count;
    movedOffers += o.count;
    console.log(
      `  ${src.name || src.id}: moved modules=${m.count} plans=${p.count} offers=${o.count}`,
    );
  }

  await prisma.apps.updateMany({
    where: { id: { not: raptor.id }, deleted_at: null },
    data: { kind: "deployment" },
  });

  console.log(
    `OK: Raptor #${raptor.id} = template. Moved modules=${movedModules} plans=${movedPlans} offers=${movedOffers}. Other apps = deployment.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
