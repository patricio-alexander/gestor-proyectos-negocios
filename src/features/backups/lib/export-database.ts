import fs from "fs/promises";
import path from "path";
import { prisma } from "@/src/shared/lib/prisma";

/** Carpeta de backups (similar a EdDeli backend/src/backups). */
export const BACKUPS_DIR = path.join(process.cwd(), "backups");
export const MAIN_BACKUP_PATH = path.join(BACKUPS_DIR, "backup.json");

export type DbClient = typeof prisma;

type Delegate = {
  findMany: (args?: object) => Promise<unknown[]>;
};

export const BACKUP_TABLE_KEYS = [
  "Role",
  "User",
  "UserRole",
  "Apps",
  "Module",
  "Section",
  "Capability",
  "AppModule",
  "AppSection",
  "Feature",
  "AppFeature",
  "Offer",
  "OfferModule",
  "Plan",
  "PlanAppModule",
  "PlanPrice",
  "PlanOffer",
  "Subscription",
  "EventType",
  "Event",
  /** Noticias empujadas a apps Vite. */
  "NewsItem",
  "NewsAppTarget",
  /** Telemetría de carga HTTP por app (FK → Apps). */
  "AppLoadSample",
  "AppLoadMinute",
  /** OTA / apps móviles (dependen de Apps vía app_id opcional). */
  "MobileApp",
  "MobileDevice",
  "MobileAppRelease",
] as const;

export type BackupTableKey = (typeof BACKUP_TABLE_KEYS)[number];

export function backupTableDelegate(db: DbClient, key: BackupTableKey): Delegate {
  switch (key) {
    case "Role":
      return db.role;
    case "User":
      return db.user;
    case "UserRole":
      return db.userRole;
    case "Apps":
      return db.apps;
    case "Module":
      return db.module;
    case "Section":
      return db.section;
    case "Capability":
      return db.capability;
    case "AppModule":
      return db.appModule;
    case "AppSection":
      return db.appSection;
    case "Feature":
      return db.feature;
    case "AppFeature":
      return db.appFeature;
    case "Offer":
      return db.offer;
    case "OfferModule":
      return db.offerModule;
    case "Plan":
      return db.plan;
    case "PlanAppModule":
      return db.planAppModule;
    case "PlanPrice":
      return db.planPrice;
    case "PlanOffer":
      return db.planOffer;
    case "Subscription":
      return db.subscription;
    case "EventType":
      return db.eventType;
    case "Event":
      return db.event;
    case "NewsItem":
      return db.newsItem;
    case "NewsAppTarget":
      return db.newsAppTarget;
    case "AppLoadSample":
      return db.appLoadSample;
    case "AppLoadMinute":
      return db.appLoadMinute;
    case "MobileApp":
      return db.mobileApp;
    case "MobileDevice":
      return db.mobileDevice;
    case "MobileAppRelease":
      return db.mobileAppRelease;
    default: {
      const _exhaustive: never = key;
      throw new Error(`Tabla de backup desconocida: ${_exhaustive}`);
    }
  }
}

/** Tablas a volcar en el JSON (nombre en archivo → prisma delegate). */
export const BACKUP_TABLE_ENTRIES: {
  key: BackupTableKey;
  get: (db?: DbClient) => Delegate;
}[] = BACKUP_TABLE_KEYS.map((key) => ({
  key,
  get: (db: DbClient = prisma) => backupTableDelegate(db, key),
}));

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeValue(v);
    }
    return out;
  }
  return value;
}

export function summarizeBackupData(data: Record<string, unknown[]>) {
  const counts: Record<string, number> = {};
  let totalRows = 0;
  for (const [key, rows] of Object.entries(data)) {
    const n = Array.isArray(rows) ? rows.length : 0;
    counts[key] = n;
    totalRows += n;
  }
  return { counts, totalRows };
}

export async function ensureBackupsDir() {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
}

function isMissingTableError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error ?? "");
  return /does not exist|P2021|Unknown table|no such table|ER_NO_SUCH_TABLE/i.test(
    msg,
  );
}

/** Vuelca las tablas del control plane + OTA móvil a un objeto JSON plano. */
export async function dumpDatabaseToJson(): Promise<{
  data: Record<string, unknown[]>;
  warnings: string[];
}> {
  const data: Record<string, unknown[]> = {};
  const warnings: string[] = [];

  for (const entry of BACKUP_TABLE_ENTRIES) {
    try {
      const rows = await entry.get().findMany();
      data[entry.key] = serializeValue(rows) as unknown[];
    } catch (error) {
      if (isMissingTableError(error)) {
        warnings.push(`${entry.key}: tabla no existe en la BD (ejecutá prisma migrate deploy)`);
        data[entry.key] = [];
        continue;
      }
      throw error;
    }
  }

  return { data, warnings };
}

function timestampSuffix(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

/**
 * Exporta la BD a JSON, guarda copia fechada y actualiza backup.json principal.
 */
export async function saveBackup(options?: { updateMain?: boolean }) {
  const updateMain = options?.updateMain ?? true;
  await ensureBackupsDir();

  const { data, warnings } = await dumpDatabaseToJson();
  const payload = JSON.stringify(data, null, 2);
  const filename = `backup-gestor-${timestampSuffix()}.json`;
  const storedPath = path.join(BACKUPS_DIR, filename);

  await fs.writeFile(storedPath, payload, "utf8");
  if (updateMain) {
    await fs.writeFile(MAIN_BACKUP_PATH, payload, "utf8");
  }

  const summary = summarizeBackupData(data);
  return {
    filename,
    storedPath,
    mainPath: MAIN_BACKUP_PATH,
    sizeBytes: Buffer.byteLength(payload, "utf8"),
    warnings,
    ...summary,
  };
}

export async function getMainBackupInfo() {
  try {
    const st = await fs.stat(MAIN_BACKUP_PATH);
    const raw = await fs.readFile(MAIN_BACKUP_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown[]>;
    const summary = summarizeBackupData(parsed);
    return {
      exists: true,
      path: MAIN_BACKUP_PATH,
      filename: "backup.json",
      sizeBytes: st.size,
      sizeMB: Number((st.size / (1024 * 1024)).toFixed(3)),
      modifiedAt: st.mtime.toISOString(),
      ...summary,
    };
  } catch {
    return {
      exists: false,
      path: MAIN_BACKUP_PATH,
      filename: "backup.json",
      sizeBytes: 0,
      sizeMB: 0,
      modifiedAt: null as string | null,
      counts: {} as Record<string, number>,
      totalRows: 0,
    };
  }
}

export async function listStoredBackups() {
  await ensureBackupsDir();
  const names = await fs.readdir(BACKUPS_DIR);
  const stored = [];

  for (const name of names) {
    if (name === "backup.json" || !name.endsWith(".json")) continue;
    if (!name.startsWith("backup-gestor-") && !name.startsWith("backup-gestor-import-")) continue;
    const full = path.join(BACKUPS_DIR, name);
    const st = await fs.stat(full);
    stored.push({
      filename: name,
      sizeBytes: st.size,
      sizeMB: Number((st.size / (1024 * 1024)).toFixed(3)),
      modifiedAt: st.mtime.toISOString(),
    });
  }

  stored.sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));
  return stored;
}

export function isSafeBackupFilename(filename: string) {
  return (
    filename === "backup.json" ||
    (/^backup-gestor(?:-import)?-[\w.-]+\.json$/.test(filename) &&
      !filename.includes(".."))
  );
}

export async function readBackupFile(filename: string) {
  if (!isSafeBackupFilename(filename)) {
    throw new Error("Nombre de archivo no permitido");
  }
  const full =
    filename === "backup.json"
      ? MAIN_BACKUP_PATH
      : path.join(BACKUPS_DIR, filename);
  const content = await fs.readFile(full);
  return { full, content };
}
