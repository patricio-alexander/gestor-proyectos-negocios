/**
 * Sincroniza EDDELI_PRODUCT_CATALOG (TS) → BD del gestor (módulos/secciones/capabilities).
 * Uso: npx tsx scripts/sync-product-catalog.mjs
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

function catalogStatus(status) {
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

async function seedSectionCapabilities(sectionId, caps) {
  for (const cap of caps) {
    await prisma.capability.upsert({
      where: {
        section_id_code: { section_id: sectionId, code: cap.code },
      },
      update: { name: cap.name },
      create: {
        section_id: sectionId,
        code: cap.code,
        name: cap.name,
      },
    });
  }
}

async function main() {
  let sectionCount = 0;
  for (const modDef of EDDELI_PRODUCT_CATALOG) {
    const modStatus = catalogStatus(modDef.status);
    const mod = await prisma.module.upsert({
      where: { key: modDef.key },
      update: {
        name: modDef.name,
        description: modDef.description,
        status: modStatus,
        is_maintainer: false,
        deleted_at: null,
      },
      create: {
        key: modDef.key,
        name: modDef.name,
        description: modDef.description,
        status: modStatus,
        is_maintainer: false,
      },
    });

    const allowedKeys = new Set(modDef.sections.map((s) => s.key));
    for (const secDef of modDef.sections) {
      const secStatus = catalogStatus(secDef.status);
      const existing = await prisma.section.findFirst({
        where: { module_id: mod.id, key: secDef.key, deleted_at: null },
      });
      let sectionId;
      if (existing) {
        await prisma.section.update({
          where: { id: existing.id },
          data: { name: secDef.name, status: secStatus, deleted_at: null },
        });
        sectionId = existing.id;
      } else {
        const softDeleted = await prisma.section.findFirst({
          where: { module_id: mod.id, key: secDef.key },
        });
        if (softDeleted) {
          await prisma.section.update({
            where: { id: softDeleted.id },
            data: { name: secDef.name, status: secStatus, deleted_at: null },
          });
          sectionId = softDeleted.id;
        } else {
          const created = await prisma.section.create({
            data: {
              module_id: mod.id,
              key: secDef.key,
              name: secDef.name,
              status: secStatus,
            },
          });
          sectionId = created.id;
        }
      }
      if (secDef.capabilities?.length) {
        await seedSectionCapabilities(sectionId, secDef.capabilities);
      }
      sectionCount += 1;
    }

    const obsolete = await prisma.section.findMany({
      where: {
        module_id: mod.id,
        deleted_at: null,
        OR: [{ key: null }, { key: { notIn: [...allowedKeys] } }],
      },
    });
    for (const sec of obsolete) {
      await prisma.section.update({
        where: { id: sec.id },
        data: { deleted_at: new Date() },
      });
      console.log("soft-deleted obsolete:", modDef.key, sec.key, sec.name);
    }
  }

  const ventas = await prisma.module.findFirst({
    where: { key: "ventas", deleted_at: null },
    include: {
      sections: { where: { deleted_at: null }, orderBy: { id: "asc" } },
    },
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        sectionsSynced: sectionCount,
        ventas: {
          name: ventas?.name,
          sections: ventas?.sections?.map((s) => ({
            name: s.name,
            key: s.key,
          })),
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
