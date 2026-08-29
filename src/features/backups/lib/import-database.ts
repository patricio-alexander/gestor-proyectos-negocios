import fs from "fs/promises";
import path from "path";
import { prisma } from "@/src/shared/lib/prisma";
import { sealSecret } from "@/src/shared/lib/secret-crypto";
import {
  BACKUP_TABLE_KEYS,
  backupTableDelegate,
  ensureBackupsDir,
  MAIN_BACKUP_PATH,
  BACKUPS_DIR,
  summarizeBackupData,
  type BackupTableKey,
  type DbClient,
} from "./export-database";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

type WritableDelegate = {
  deleteMany: (args?: object) => Promise<{ count: number }>;
  createMany: (args: {
    data: Record<string, unknown>[];
    skipDuplicates?: boolean;
  }) => Promise<{ count: number }>;
};

function deserializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string" && ISO_DATE_RE.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  if (Array.isArray(value)) return value.map(deserializeValue);
  return value;
}

function deserializeRows(rows: unknown[]): Record<string, unknown>[] {
  return rows.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error("Cada fila del backup debe ser un objeto");
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
      out[key] = deserializeValue(value);
    }
    return out;
  });
}

const BIGINT_FIELDS = new Set(["id", "bytes_in", "bytes_out"]);

function reviveBigIntFields(
  key: BackupTableKey,
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  if (key !== "AppLoadMinute" && key !== "AppLoadSample") return rows;
  return rows.map((row) => {
    const out = { ...row };
    for (const field of BIGINT_FIELDS) {
      const v = out[field];
      if (typeof v === "string" && /^\d+$/.test(v)) {
        out[field] = BigInt(v);
      } else if (typeof v === "number" && Number.isFinite(v)) {
        out[field] = BigInt(Math.trunc(v));
      }
    }
    return out;
  });
}

export function parseBackupJson(raw: string): Record<BackupTableKey, unknown[]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("El archivo no es JSON válido");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("El JSON debe ser un objeto con tablas");
  }

  const source = parsed as Record<string, unknown>;
  const knownKeys = new Set<string>(BACKUP_TABLE_KEYS);
  const hasKnownTable = BACKUP_TABLE_KEYS.some(
    (key) => Array.isArray(source[key]) && source[key]!.length > 0,
  );

  if (!hasKnownTable) {
    throw new Error(
      "No se encontraron tablas válidas en el JSON (formato de backup del gestor)",
    );
  }

  const result = {} as Record<BackupTableKey, unknown[]>;
  for (const key of BACKUP_TABLE_KEYS) {
    const value = source[key];
    if (value === undefined) {
      result[key] = [];
      continue;
    }
    if (!Array.isArray(value)) {
      throw new Error(`La tabla "${key}" debe ser un array`);
    }
    result[key] = value;
  }

  for (const key of Object.keys(source)) {
    if (!knownKeys.has(key)) {
      console.warn(`[backups/import] Ignorando clave desconocida: ${key}`);
    }
  }

  return result;
}

function timestampSuffix(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

/** Borra todas las tablas del backup e inserta las filas del JSON (reemplazo total). */
export async function restoreDatabaseFromBackup(
  data: Record<BackupTableKey, unknown[]>,
  options?: { savePayload?: string },
) {
  const summary = summarizeBackupData(
    data as Record<string, unknown[]>,
  );

  await prisma.$transaction(
    async (tx) => {
      const db = tx as DbClient;

      await db.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");

      for (const key of [...BACKUP_TABLE_KEYS].reverse()) {
        const delegate = backupTableDelegate(
          db,
          key,
        ) as unknown as WritableDelegate;
        await delegate.deleteMany({});
      }

      for (const key of BACKUP_TABLE_KEYS) {
        const rows = data[key];
        if (!rows.length) continue;
        const delegate = backupTableDelegate(
          db,
          key,
        ) as unknown as WritableDelegate;
        await delegate.createMany({
          data: reviveBigIntFields(key, deserializeRows(rows)),
        });
      }

      await db.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    },
    { timeout: 120_000 },
  );

  await sealStoredSecretsAfterRestore();

  if (options?.savePayload) {
    await ensureBackupsDir();
    const filename = `backup-gestor-import-${timestampSuffix()}.json`;
    await fs.writeFile(path.join(BACKUPS_DIR, filename), options.savePayload, "utf8");
    await fs.writeFile(MAIN_BACKUP_PATH, options.savePayload, "utf8");
  }

  return summary;
}

export async function importBackupFromJson(raw: string) {
  const data = parseBackupJson(raw);
  const summary = await restoreDatabaseFromBackup(data, { savePayload: raw });
  return summary;
}

/** Restaura desde el backup.json fijo del servidor. */
export async function reloadFromMainBackup() {
  const raw = await fs.readFile(MAIN_BACKUP_PATH, "utf8");
  const data = parseBackupJson(raw);
  return restoreDatabaseFromBackup(data);
}

/** Cifra en reposo secretos legacy en texto plano tras un restore. */
export async function sealStoredSecretsAtRest() {
  const apps = await prisma.apps.findMany({
    where: { deleted_at: null, entitlement_secret: { not: null } },
    select: { id: true, entitlement_secret: true },
  });
  for (const app of apps) {
    const sealed = sealSecret(app.entitlement_secret);
    if (sealed && sealed !== app.entitlement_secret) {
      await prisma.apps.update({
        where: { id: app.id },
        data: { entitlement_secret: sealed },
      });
    }
  }

  const mobiles = await prisma.mobileApp.findMany({
    where: { deleted_at: null },
    select: { id: true, api_key: true },
  });
  for (const mobile of mobiles) {
    const sealed = sealSecret(mobile.api_key);
    if (sealed && sealed !== mobile.api_key) {
      await prisma.mobileApp.update({
        where: { id: mobile.id },
        data: { api_key: sealed },
      });
    }
  }
}

async function sealStoredSecretsAfterRestore() {
  await sealStoredSecretsAtRest();
}
