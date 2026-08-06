/**
 * Base: backup del servidor (Descargas / backups/).
 * Aplica Feature/AppFeature nuevos y re-exporta backup.json completo.
 *
 * Uso: npx tsx scripts/merge-server-backup-with-features.ts
 */
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { importBackupFromJson } from "../src/features/backups/lib/import-database";
import { saveBackup } from "../src/features/backups/lib/export-database";
import { ensureFeatureCatalog, FEATURE_KEYS } from "../src/shared/lib/feature-catalog";
import { prisma } from "../src/shared/lib/prisma";

const BACKUPS_DIR = path.join(process.cwd(), "backups");
const CANDIDATES = [
  path.join(BACKUPS_DIR, "backup-gestor-2026-08-06_10-29-11.json"),
  path.join(BACKUPS_DIR, "backup.json"),
  path.join(
    process.env.HOME || "",
    "Descargas/backup-gestor-2026-08-06_10-29-11.json",
  ),
];

/** Defaults seguros: no pisan override si ya existe. */
const APP_FEATURE_DEFAULTS: Array<{
  nameMatch: RegExp;
  featureKey: string;
  status: "active" | "planned" | "hidden" | "maintenance" | "developer";
}> = [
  { nameMatch: /^eddeli$/i, featureKey: FEATURE_KEYS.MULTI_STOCK, status: "active" },
  { nameMatch: /^store$/i, featureKey: FEATURE_KEYS.MULTI_STOCK, status: "planned" },
];

async function resolveBackupPath() {
  for (const p of CANDIDATES) {
    try {
      await fs.access(p);
      return p;
    } catch {
      /* next */
    }
  }
  throw new Error(
    "No encontré backup-gestor-2026-08-06_10-29-11.json en backups/ ni Descargas",
  );
}

async function applyFeatureDefaults() {
  await ensureFeatureCatalog();

  const features = await prisma.feature.findMany({
    where: { deleted_at: null },
    select: { id: true, key: true },
  });
  const featureByKey = new Map(features.map((f) => [f.key, f.id]));

  const apps = await prisma.apps.findMany({
    where: { deleted_at: null, kind: "deployment" },
    select: { id: true, name: true },
  });

  const applied: string[] = [];
  for (const app of apps) {
    const name = app.name || "";
    for (const def of APP_FEATURE_DEFAULTS) {
      if (!def.nameMatch.test(name)) continue;
      const featureId = featureByKey.get(def.featureKey);
      if (!featureId) continue;

      const existing = await prisma.appFeature.findUnique({
        where: {
          app_id_feature_id: { app_id: app.id, feature_id: featureId },
        },
      });
      if (existing) {
        applied.push(`${name}: ${def.featureKey}=${existing.status} (ya existía)`);
        continue;
      }

      await prisma.appFeature.create({
        data: {
          app_id: app.id,
          feature_id: featureId,
          status: def.status,
        },
      });
      applied.push(`${name}: ${def.featureKey}=${def.status} (creado)`);
    }
  }
  return applied;
}

async function main() {
  const backupPath = await resolveBackupPath();
  console.log("1) Restaurando backup base:", backupPath);
  const raw = await fs.readFile(backupPath, "utf8");
  const summary = await importBackupFromJson(raw);
  console.log("   filas totales:", summary.totalRows);
  console.log("   tablas:", summary.counts);

  console.log("2) Aplicando catálogo Feature + defaults por app…");
  const applied = await applyFeatureDefaults();
  for (const line of applied) console.log("  ·", line);

  const features = await prisma.feature.findMany({
    where: { deleted_at: null },
  });
  const appFeatures = await prisma.appFeature.findMany({
    include: { feature: { select: { key: true } }, app: { select: { name: true } } },
  });
  console.log("   Feature rows:", features.length);
  console.log(
    "   AppFeature:",
    appFeatures.map((af) => `${af.app.name}/${af.feature.key}=${af.status}`),
  );

  console.log("3) Exportando backup completo (con Feature/AppFeature)…");
  const exported = await saveBackup({ updateMain: true });
  console.log("   →", exported.filename);
  console.log("   → backup.json actualizado");
  console.log("   size MB:", (exported.sizeBytes / 1024 / 1024).toFixed(3));
  console.log("   Feature:", exported.counts.Feature ?? 0);
  console.log("   AppFeature:", exported.counts.AppFeature ?? 0);
  console.log("Listo. Subí backups/backup.json (o el fechado) al servidor e importá.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
