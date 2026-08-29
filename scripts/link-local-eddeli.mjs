/**
 * Enlace local gestor ↔ EdDeli: limpia módulos legacy, sincroniza catálogo,
 * apunta entitlement_url a localhost y empuja el payload.
 *
 * Uso: npx tsx scripts/link-local-eddeli.mjs
 */
import "dotenv/config";
import {
  pruneDeletedModulesFromApps,
  retireCanalDigitalModule,
  retireComprobantesElectronicosModule,
  retireLegacyCanalModule,
} from "../src/features/modules/lib/cleanup-module-assignments.ts";
import { pushEntitlementToApp } from "../src/shared/lib/push-entitlement.ts";
import { prisma } from "../src/shared/lib/prisma.ts";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const LOCAL_URL =
  process.env.EDDELI_ENTITLEMENT_URL?.trim() ||
  "http://127.0.0.1:3001/eddeliapi/subscription/entitlement";
const LOCAL_SECRET =
  process.env.EDDELI_ENTITLEMENT_SECRET?.trim() ||
  "gc_4a177c0295a4cb88d52cea1035b9e9a5";

async function main() {
  console.log("==> 1/4 Cleanup módulos legacy");
  console.log("  canal:", await retireLegacyCanalModule());
  console.log("  canal_digital:", await retireCanalDigitalModule());
  console.log("  comprobantes_electronicos:", await retireComprobantesElectronicosModule());
  console.log("  deleted links:", await pruneDeletedModulesFromApps());

  console.log("==> 2/4 Sync catálogo (módulos/secciones)");
  const sync = spawnSync("npm", ["run", "db:sync-catalog"], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  if (sync.stdout) process.stdout.write(sync.stdout);
  if (sync.stderr) process.stderr.write(sync.stderr);
  if (sync.status !== 0) {
    throw new Error(`db:sync-catalog falló con código ${sync.status}`);
  }

  console.log("==> 3/4 Apuntar EdDeli a entitlement LOCAL");
  const eddeli =
    (await prisma.apps.findFirst({
      where: { deleted_at: null, name: { contains: "EdDeli" } },
    })) ||
    (await prisma.apps.findFirst({
      where: { deleted_at: null, name: { contains: "eddeli" } },
    }));

  if (!eddeli) {
    throw new Error("No encontré app EdDeli en la BD del gestor");
  }

  await prisma.apps.update({
    where: { id: eddeli.id },
    data: {
      entitlement_url: LOCAL_URL,
      entitlement_secret: LOCAL_SECRET,
    },
  });
  console.log(`  ${eddeli.name} (#${eddeli.id}) → ${LOCAL_URL}`);

  console.log("==> 4/4 Push entitlement a EdDeli local");
  const push = await pushEntitlementToApp(eddeli.hash);
  console.log("  push:", push);

  const banned = await prisma.module.findMany({
    where: {
      key: { in: ["comprobantes_electronicos", "canal_digital", "canal"] },
      deleted_at: null,
    },
    select: { key: true },
  });
  if (banned.length) {
    console.warn("  ⚠ módulos legacy aún activos:", banned.map((m) => m.key));
  } else {
    console.log("  ✓ sin módulos legacy activos");
  }

  await prisma.$disconnect();
  console.log("Listo. Probá http://127.0.0.1:5173/eddeli/ con npm run eddeli");
}

main().catch(async (err) => {
  console.error(err);
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
