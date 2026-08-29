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
    "tienda_gestor_sync_local_dev",
};

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
  console.log("==> Alinear Sync Store = EdDeli (local)");
  await alignStore();
  console.log("==> Alinear Sync Tienda");
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
