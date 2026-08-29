/**
 * Empuja entitlement actual (Plan Socios ACTIVE) a Store y Tienda locales.
 * Uso: npx tsx scripts/push-local-entitlements.ts
 */
import "dotenv/config";
import { pushEntitlementToApp } from "../src/shared/lib/push-entitlement.ts";
import { prisma } from "../src/shared/lib/prisma.ts";

async function main() {
  const apps = await prisma.apps.findMany({
    where: { deleted_at: null, kind: { not: "mobile" } },
    select: { id: true, name: true, hash: true, entitlement_url: true },
  });

  const targets = apps.filter((a) =>
    /^(eddeli|store|tienda)$/i.test(String(a.name || "")),
  );

  for (const app of targets) {
    console.log(`→ Push #${app.id} ${app.name}`);
    console.log(`  ${app.entitlement_url}`);
    const result = await pushEntitlementToApp(app.hash);
    console.log(
      result.ok
        ? `  ✅ OK${result.skipped ? " (omitido)" : ""}`
        : `  ❌ ${result.error} (HTTP ${result.status ?? "—"})`,
    );
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
