/**
 * Aplica statuses del catálogo TS a la BD (módulos/secciones EdDeli).
 * Uso: node scripts/apply-catalog-statuses.mjs
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/generated/prisma/client.ts";
import { EDDELI_PRODUCT_CATALOG } from "../src/shared/config/eddeli-product-catalog.ts";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 1,
});

const prisma = new PrismaClient({ adapter });

/** Alineado a UI: development → maintenance */
function normalizeStatus(status) {
  if (status === "development") return "maintenance";
  if (
    status === "active" ||
    status === "maintenance" ||
    status === "developer" ||
    status === "planned"
  ) {
    return status;
  }
  return "active";
}

async function main() {
  const app = await prisma.apps.findFirst({
    where: { deleted_at: null, name: { contains: "EdDeli" } },
    orderBy: { id: "asc" },
  });
  if (!app) throw new Error("App EdDeli no encontrada");

  const counts = {
    modules: 0,
    sections: 0,
    byModule: {},
    bySection: {},
  };

  for (const modDef of EDDELI_PRODUCT_CATALOG) {
    const modStatus = normalizeStatus(modDef.status);
    const mod = await prisma.module.findFirst({
      where: { app_id: app.id, key: modDef.key, deleted_at: null },
    });
    if (!mod) {
      console.warn(`módulo no encontrado: ${modDef.key}`);
      continue;
    }
    await prisma.module.update({
      where: { id: mod.id },
      data: { status: modStatus },
    });
    counts.modules += 1;
    counts.byModule[modStatus] = (counts.byModule[modStatus] || 0) + 1;

    for (const secDef of modDef.sections) {
      const secStatus = normalizeStatus(secDef.status);
      const sec = await prisma.section.findFirst({
        where: { module_id: mod.id, key: secDef.key, deleted_at: null },
      });
      if (!sec) {
        console.warn(`sección no encontrada: ${modDef.key} / ${secDef.key}`);
        continue;
      }
      await prisma.section.update({
        where: { id: sec.id },
        data: { status: secStatus },
      });
      counts.sections += 1;
      counts.bySection[secStatus] = (counts.bySection[secStatus] || 0) + 1;
    }
  }

  console.log(JSON.stringify({ app: app.name, appId: app.id, ...counts }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
