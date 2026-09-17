/**
 * Realinea secretos/URLs locales EdDeli/Store/Tienda tras un restore.
 * Uso: npx tsx scripts/realign-local-entitlements.ts
 */
import "dotenv/config";
import { realignLocalEntitlementsAfterRestore } from "../src/features/backups/lib/realign-local-entitlements.ts";

async function main() {
  process.env.REALIGN_ENTITLEMENTS_AFTER_RESTORE = "1";
  const result = await realignLocalEntitlementsAfterRestore();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
