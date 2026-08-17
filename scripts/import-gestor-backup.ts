import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { importBackupFromJson } from "../src/features/backups/lib/import-database";

const file =
  process.argv[2] ||
  path.join(process.cwd(), "backups/backup-gestor-2026-08-17_15-53-05.json");

async function main() {
  const raw = await fs.readFile(file, "utf8");
  console.log(`Importando ${file} (${(raw.length / 1024 / 1024).toFixed(1)} MB)...`);
  const summary = await importBackupFromJson(raw);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
