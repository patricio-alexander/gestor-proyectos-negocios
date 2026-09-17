/**
 * Alinea Store (y opcional Tienda) a la misma estructura Sync local que EdDeli.
 * Uso: npx tsx scripts/align-store-sync-like-eddeli.ts
 */
import "dotenv/config";
import { prisma } from "../src/shared/lib/prisma.ts";
import { sealSecret } from "../src/shared/lib/secret-crypto.ts";
import { pushEntitlementToApp } from "../src/shared/lib/push-entitlement.ts";

const STORE = {
  url:
    process.env.STORE_ENTITLEMENT_URL?.trim() ||
    "http://127.0.0.1:3003/storeapi/subscription/entitlement",
  secret:
    process.env.STORE_ENTITLEMENT_SECRET?.trim() ||
    "gc_46ba297fd7a64b1dde02252adc16d936",
};

const TIENDA = {
  url:
    process.env.TIENDA_ENTITLEMENT_URL?.trim() ||
    "http://127.0.0.1:3004/tiendaapi/subscription/entitlement",
  secret:
    process.env.TIENDA_ENTITLEMENT_SECRET?.trim() ||
    "gc_7c3e91a2b8f04d55e6a1c09d4f2b87e0",
};

const EDDELI = {
  url:
    process.env.EDDELI_ENTITLEMENT_URL?.trim() ||
    "http://127.0.0.1:3001/eddeliapi/subscription/entitlement",
  secret:
    process.env.EDDELI_ENTITLEMENT_SECRET?.trim() ||
    "gc_4a177c0295a4cb88d52cea1035b9e9a5",
};

async function alignEdDeli() {
  const app = await prisma.apps.findFirst({
    where: { deleted_at: null, name: { in: ["EdDeli", "eddeli"] } },
  });
  if (!app) throw new Error("No encontré app EdDeli");

  const updated = await prisma.apps.update({
    where: { id: app.id },
    data: {
      name: "EdDeli",
      kind: "deployment",
      entitlement_url: EDDELI.url,
      entitlement_secret: sealSecret(EDDELI.secret),
      maintenance: false,
      deleted_at: null,
    },
  });
  console.log(`EdDeli #${updated.id} → ${updated.entitlement_url}`);
  const push = await pushEntitlementToApp(updated.hash);
  console.log(
    push.ok
      ? "  push entitlement: OK"
      : `  push entitlement: FAIL ${push.error}`,
  );
  return updated;
}

async function alignStore() {
  const app =
    (await prisma.apps.findFirst({
      where: { deleted_at: null, OR: [{ name: "Store" }, { name: "store" }] },
    })) || null;

  if (!app) throw new Error("No encontré app Store");

  const updated = await prisma.apps.update({
    where: { id: app.id },
    data: {
      name: "Store",
      kind: "deployment",
      owner_name: app.owner_name || "Store",
      email: app.email || "soporte@store.local",
      database_name: app.database_name || "store",
      path: null,
      maintenance: false,
      deleted_at: null,
      entitlement_url: STORE.url,
      entitlement_secret: sealSecret(STORE.secret),
    },
  });

  console.log(`Store #${updated.id}`);
  console.log(`  name: ${app.name} → Store`);
  console.log(`  owner/email/db: ${updated.owner_name} / ${updated.email} / ${updated.database_name}`);
  console.log(`  entitlement_url: ${updated.entitlement_url}`);

  const push = await pushEntitlementToApp(updated.hash);
  console.log(
    push.ok
      ? "  push entitlement: OK"
      : `  push entitlement: FAIL ${push.error}`,
  );
  return updated;
}

async function alignTienda() {
  const app = await prisma.apps.findFirst({
    where: { deleted_at: null, name: { contains: "ienda" } },
  });
  if (!app) {
    console.warn("Tienda no encontrada, skip");
    return null;
  }
  const updated = await prisma.apps.update({
    where: { id: app.id },
    data: {
      name: "Tienda",
      kind: "deployment",
      entitlement_url: TIENDA.url,
      entitlement_secret: sealSecret(TIENDA.secret),
      maintenance: false,
      deleted_at: null,
    },
  });
  console.log(`Tienda #${updated.id} → ${updated.entitlement_url}`);
  const push = await pushEntitlementToApp(updated.hash);
  console.log(
    push.ok
      ? "  push entitlement: OK"
      : `  push entitlement: FAIL ${push.error}`,
  );
  return updated;
}

async function main() {
  console.log("==> Alinear Sync local (EdDeli + Store + Tienda)");
  await alignEdDeli();
  await alignStore();
  await alignTienda();
  console.log("Listo. Recargá /dashboard/apps — Sync debe decir Desarrollo · En línea");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
