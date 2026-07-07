import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client";
import {
  DEFAULT_ROLES,
  EDDELI_PRODUCT_CATALOG,
  type CatalogModuleDef,
} from "../src/shared/config/eddeli-product-catalog";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 1,
});

const prisma = new PrismaClient({ adapter });

async function seedRoles() {
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name, description: role.description },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
      },
    });
  }

  const legacySuperadmin = await prisma.role.findUnique({
    where: { key: "superadmin" },
  });
  const programador = await prisma.role.findUnique({
    where: { key: "programador" },
  });
  if (legacySuperadmin && programador) {
    const links = await prisma.userRole.findMany({
      where: { role_id: legacySuperadmin.id },
    });
    for (const link of links) {
      await prisma.userRole.upsert({
        where: {
          user_id_role_id: { user_id: link.user_id, role_id: programador.id },
        },
        update: {},
        create: { user_id: link.user_id, role_id: programador.id },
      });
    }
    await prisma.userRole.deleteMany({
      where: { role_id: legacySuperadmin.id },
    });
    await prisma.role.delete({ where: { id: legacySuperadmin.id } });
  }
}

async function assignRoles(userId: string, roleKeys: string[]) {
  for (const key of roleKeys) {
    const role = await prisma.role.findUnique({ where: { key } });
    if (!role) continue;
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: userId, role_id: role.id } },
      update: {},
      create: { user_id: userId, role_id: role.id },
    });
  }
}

/** Cuentas del gestor — alineadas con EdDeli (User + Account → User unificado). */
async function seedGestorAccounts() {
  const password = await bcrypt.hash("12345678", 10);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { id: "edgar-torres-id" },
        { username: "administrador" },
        { username: "Administrador" },
        { username: "admin" },
        { email: "admin@mail.com" },
      ],
    },
  });

  const edgar = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          username: "administrador",
          email: "edgar@mail.com",
          display_name: "Edgar Torres",
          password,
          deleted_at: null,
        },
      })
    : await prisma.user.create({
        data: {
          id: "edgar-torres-id",
          username: "administrador",
          email: "edgar@mail.com",
          display_name: "Edgar Torres",
          password,
        },
      });

  await assignRoles(edgar.id, ["programador", "admin"]);

  const demoAccounts = [
    {
      id: "gestor-operador-id",
      username: "operador",
      email: "operador@mail.com",
      display_name: "Operador Demo",
      roleKeys: ["operator"],
    },
    {
      id: "gestor-soporte-id",
      username: "soporte",
      email: "soporte@mail.com",
      display_name: "Soporte EdDeli",
      roleKeys: ["admin"],
    },
  ] as const;

  for (const account of demoAccounts) {
    const row = await prisma.user.upsert({
      where: { username: account.username },
      update: {
        email: account.email,
        display_name: account.display_name,
        password,
        deleted_at: null,
      },
      create: {
        id: account.id,
        username: account.username,
        email: account.email,
        display_name: account.display_name,
        password,
      },
    });
    await assignRoles(row.id, [...account.roleKeys]);
  }
}

const EDDELI_APP_HASH = crypto
  .createHash("sha256")
  .update("eddeli-seed-app")
  .digest("hex")
  .slice(0, 32);

async function seedEdDeliApp() {
  return prisma.apps.upsert({
    where: { hash: EDDELI_APP_HASH },
    update: { name: "EdDeli", deleted_at: null },
    create: {
      hash: EDDELI_APP_HASH,
      name: "EdDeli",
      owner_name: "EdDeli",
      email: "soporte@eddeli.com",
    },
  });
}

async function seedEdDeliCatalog(appId: number, catalog: CatalogModuleDef[]) {
  let sectionCount = 0;

  for (const modDef of catalog) {
    const mod = await prisma.module.upsert({
      where: {
        app_id_key: { app_id: appId, key: modDef.key },
      },
      update: {
        name: modDef.name,
        description: modDef.description,
        is_active: true,
        deleted_at: null,
      },
      create: {
        app_id: appId,
        key: modDef.key,
        name: modDef.name,
        description: modDef.description,
        is_active: true,
      },
    });

    for (const secDef of modDef.sections) {
      const existing = await prisma.section.findFirst({
        where: { module_id: mod.id, key: secDef.key, deleted_at: null },
      });

      if (existing) {
        await prisma.section.update({
          where: { id: existing.id },
          data: { name: secDef.name },
        });
      } else {
        await prisma.section.create({
          data: {
            module_id: mod.id,
            key: secDef.key,
            name: secDef.name,
          },
        });
      }

      sectionCount += 1;
    }
  }

  return sectionCount;
}

async function main() {
  await seedRoles();
  await seedGestorAccounts();
  const eddeliApp = await seedEdDeliApp();
  const sectionCount = await seedEdDeliCatalog(
    eddeliApp.id,
    EDDELI_PRODUCT_CATALOG,
  );

  console.log(
    "Seed OK: roles, EdDeli (%d módulos, %d secciones), cuentas (administrador/Edgar Torres + demo)",
    EDDELI_PRODUCT_CATALOG.length,
    sectionCount,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
