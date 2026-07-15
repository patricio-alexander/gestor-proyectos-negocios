import "dotenv/config";
import { writeFileSync } from "node:fs";
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

const app = await prisma.apps.findFirst({
  where: { deleted_at: null, kind: "template" },
  orderBy: { id: "asc" },
});
if (!app) throw new Error("App plantilla Raptor no encontrada");

const modules = await prisma.module.findMany({
  where: { app_id: app.id, deleted_at: null },
  include: {
    sections: { where: { deleted_at: null }, orderBy: { id: "asc" } },
  },
  orderBy: { id: "asc" },
});

const payload = {
  exportedAt: new Date().toISOString(),
  app: { id: app.id, name: app.name, hash: app.hash },
  modules: modules.map((m) => ({
    key: m.key,
    name: m.name,
    status: m.status,
    sections: m.sections.map((s) => ({
      key: s.key,
      name: s.name,
      status: s.status,
    })),
  })),
};

const out = "src/shared/config/eddeli-statuses.json";
writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`wrote ${out} (${modules.length} modules)`);
await prisma.$disconnect();
