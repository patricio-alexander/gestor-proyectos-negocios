/**
 * Apunta Store y Tienda a backends locales (como EdDeli).
 * Uso: npx tsx scripts/point-apps-entitlement-local.ts
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/generated/prisma/client.ts";
import { sealSecret } from "../src/shared/lib/secret-crypto.ts";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: process.env.DATABASE_HOST || "localhost",
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "raptorsolutions",
    connectionLimit: 1,
  }),
});

const LOCAL_APPS = [
  {
    nameMatch: /^eddeli$/i,
    entitlement_url: "http://127.0.0.1:3001/eddeliapi/subscription/entitlement",
    entitlement_secret: "gc_4a177c0295a4cb88d52cea1035b9e9a5",
  },
  {
    nameMatch: /^store$/i,
    entitlement_url: "http://127.0.0.1:3003/storeapi/subscription/entitlement",
    entitlement_secret: "gc_46ba297fd7a64b1dde02252adc16d936",
  },
  {
    nameMatch: /^tienda$/i,
    entitlement_url: "http://127.0.0.1:3004/tiendaapi/subscription/entitlement",
    entitlement_secret: "tienda_gestor_sync_local_dev",
  },
];

async function main() {
  const apps = await prisma.apps.findMany({
    where: { deleted_at: null, kind: { not: "mobile" } },
    select: { id: true, name: true, entitlement_url: true },
  });

  for (const cfg of LOCAL_APPS) {
    const app = apps.find((a) => cfg.nameMatch.test(String(a.name || "")));
    if (!app) {
      console.warn(`⚠️  No encontré app: ${cfg.nameMatch}`);
      continue;
    }
    await prisma.apps.update({
      where: { id: app.id },
      data: {
        entitlement_url: cfg.entitlement_url,
        entitlement_secret: sealSecret(cfg.entitlement_secret),
      },
    });
    console.log(`✅ #${app.id} ${app.name}`);
    console.log(`   ${app.entitlement_url || "(sin url)"}`);
    console.log(`   → ${cfg.entitlement_url}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
