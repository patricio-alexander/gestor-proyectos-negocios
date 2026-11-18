import { prisma } from "@/src/shared/lib/prisma";

let ensured = false;
let ensuring: Promise<void> | null = null;

const NEEDED: { name: string; ddl: string }[] = [
  {
    name: "update_force",
    ddl: "ALTER TABLE `Apps` ADD COLUMN `update_force` BOOLEAN NOT NULL DEFAULT true",
  },
  {
    name: "update_available",
    ddl: "ALTER TABLE `Apps` ADD COLUMN `update_available` BOOLEAN NOT NULL DEFAULT false",
  },
  {
    name: "update_force_logout",
    ddl: "ALTER TABLE `Apps` ADD COLUMN `update_force_logout` BOOLEAN NOT NULL DEFAULT false",
  },
  {
    name: "reported_version",
    ddl: "ALTER TABLE `Apps` ADD COLUMN `reported_version` VARCHAR(40) NULL",
  },
];

/**
 * Evita que /api/apps quede vacío si el deploy trajo Prisma nuevo
 * pero migrate/db push aún no corrió en ese servidor.
 */
export async function ensureAppsUpdateColumns(): Promise<void> {
  if (ensured) return;
  if (ensuring) return ensuring;

  ensuring = (async () => {
    try {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT COLUMN_NAME AS name
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'Apps'
           AND COLUMN_NAME IN (${NEEDED.map((c) => `'${c.name}'`).join(",")})`,
      )) as { name: string }[];

      const have = new Set(rows.map((r) => String(r.name)));
      for (const col of NEEDED) {
        if (have.has(col.name)) continue;
        console.warn(`[schema] agregando columna Apps.${col.name}`);
        await prisma.$executeRawUnsafe(col.ddl);
      }
      ensured = true;
    } catch (e) {
      console.error("[schema] ensureAppsUpdateColumns falló:", e);
      // No marcar ensured: reintentar en el próximo request
      throw e;
    } finally {
      ensuring = null;
    }
  })();

  return ensuring;
}
