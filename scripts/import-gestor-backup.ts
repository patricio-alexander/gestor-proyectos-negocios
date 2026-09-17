import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { importBackupFromJson } from "../src/features/backups/lib/import-database";
import {
  BACKUPS_DIR,
  ensureBackupsDir,
  MAIN_BACKUP_PATH,
} from "../src/features/backups/lib/export-database";

/**
 * Uso:
 *   npm run setup:import -- /ruta/al/backup-gestor-raptorsolutions.json
 *   npm run setup:import -- backups/backup.json
 *
 * Copia el JSON a backups/, actualiza backup.json y restaura la BD.
 * Ideal para archivos grandes (40MB+) sin pasar por el upload HTTP.
 */
const fileArg = process.argv[2];
const file = fileArg
  ? path.isAbsolute(fileArg)
    ? fileArg
    : path.join(process.cwd(), fileArg)
  : path.join(process.cwd(), "backups/backup.json");

async function main() {
  await ensureBackupsDir();
  const raw = await fs.readFile(file, "utf8");
  const sizeMb = (Buffer.byteLength(raw, "utf8") / (1024 * 1024)).toFixed(1);
  console.log(`Importando ${file} (${sizeMb} MB)...`);

  await fs.writeFile(MAIN_BACKUP_PATH, raw, "utf8");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const archive = path.join(BACKUPS_DIR, `backup-gestor-import-${stamp}.json`);
  await fs.writeFile(archive, raw, "utf8");

  const summary = await importBackupFromJson(raw);
  console.log(JSON.stringify({ ok: true, archived: archive, ...summary }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
