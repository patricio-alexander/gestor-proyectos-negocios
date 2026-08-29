/**
 * Pone en uso (active) todos los módulos/secciones de EdDeli en el gestor
 * y empuja el entitlement al backend local.
 *
 * Uso: npx tsx scripts/activate-eddeli-modules.ts
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/generated/prisma/client.js";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "gestor_proyectos",
  connectionLimit: 1,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const apps = await prisma.apps.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      name: true,
      hash: true,
      kind: true,
      maintenance: true,
      entitlement_url: true,
    },
  });

  const eddeliApps = apps.filter(
    (a) =>
      /^eddeli$/i.test(String(a.name || "").trim()) ||
      /eddeli/i.test(String(a.name || "")),
  );

  if (!eddeliApps.length) {
    throw new Error("No se encontró la app EdDeli en el gestor.");
  }

  const summary: Record<string, unknown>[] = [];

  for (const app of eddeliApps) {
    if (app.maintenance) {
      await prisma.apps.update({
        where: { id: app.id },
        data: { maintenance: false },
      });
    }

    const appModules = await prisma.appModule.findMany({
      where: { app_id: app.id },
      select: { module_id: true, status: true },
    });
    const moduleIds = appModules.map((m) => m.module_id);

    let modulesUpdated = 0;
    let appModulesUpdated = 0;
    let sectionsUpdated = 0;
    let appSectionsUpserted = 0;

    if (moduleIds.length) {
      const modRes = await prisma.module.updateMany({
        where: {
          id: { in: moduleIds },
          deleted_at: null,
          NOT: { status: "active" },
        },
        data: { status: "active" },
      });
      modulesUpdated = modRes.count;

      const amRes = await prisma.appModule.updateMany({
        where: { app_id: app.id },
        data: { status: "active" },
      });
      appModulesUpdated = amRes.count;

      const secRes = await prisma.section.updateMany({
        where: {
          module_id: { in: moduleIds },
          deleted_at: null,
          NOT: { status: "active" },
        },
        data: { status: "active" },
      });
      sectionsUpdated = secRes.count;

      const sections = await prisma.section.findMany({
        where: { module_id: { in: moduleIds }, deleted_at: null },
        select: { id: true },
      });

      for (const sec of sections) {
        await prisma.appSection.upsert({
          where: {
            app_id_section_id: { app_id: app.id, section_id: sec.id },
          },
          create: { app_id: app.id, section_id: sec.id, status: "active" },
          update: { status: "active" },
        });
        appSectionsUpserted += 1;
      }
    }

    let push: unknown = null;
    try {
      const { pushEntitlementToApp } = await import(
        "../src/shared/lib/push-entitlement.ts"
      );
      push = await pushEntitlementToApp(app.hash);
    } catch (err) {
      push = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    summary.push({
      appId: app.id,
      name: app.name,
      kind: app.kind,
      clearedAppMaintenance: Boolean(app.maintenance),
      modulesUpdated,
      appModulesUpdated,
      sectionsUpdated,
      appSectionsUpserted,
      push,
    });
  }

  console.log(JSON.stringify({ ok: true, summary }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
