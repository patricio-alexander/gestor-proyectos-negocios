import fs from "fs/promises";
import path from "path";
import { prisma } from "@/src/shared/lib/prisma";

/** Carpeta de backups (similar a EdDeli backend/src/backups). */
export const BACKUPS_DIR = path.join(process.cwd(), "backups");
export const MAIN_BACKUP_PATH = path.join(BACKUPS_DIR, "backup.json");

type Delegate = {
  findMany: (args?: object) => Promise<unknown[]>;
};

/**
 * Tablas a volcar en el JSON (nombre en archivo → prisma delegate).
 * Orden: primero catálogos / pivotes sin dependencia fuerte de FK en export.
 */
export const BACKUP_TABLE_ENTRIES: { key: string; get: () => Delegate }[] = [
  { key: "Role", get: () => prisma.role },
  { key: "User", get: () => prisma.user },
  { key: "UserRole", get: () => prisma.userRole },
  { key: "Apps", get: () => prisma.apps },
  { key: "Module", get: () => prisma.module },
  { key: "Section", get: () => prisma.section },
  { key: "Capability", get: () => prisma.capability },
  { key: "Offer", get: () => prisma.offer },
  { key: "OfferModule", get: () => prisma.offerModule },
  { key: "Plan", get: () => prisma.plan },
  { key: "PlanAppModule", get: () => prisma.planAppModule },
  { key: "PlanPrice", get: () => prisma.planPrice },
  { key: "PlanOffer", get: () => prisma.planOffer },
  { key: "Subscription", get: () => prisma.subscription },
  { key: "EventType", get: () => prisma.eventType },
  { key: "Event", get: () => prisma.event },
];

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

/** Vuelca todas las tablas Prisma a un objeto JSON plano. */
export async function dumpDatabaseToJson(): Promise<Record<string, unknown[]>> {
  const data: Record<string, unknown[]> = {};

  for (const entry of BACKUP_TABLE_ENTRIES) {
    const rows = await entry.get().findMany();
    data[entry.key] = serializeValue(rows) as unknown[];
  }

  return data;
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

  const data = await dumpDatabaseToJson();
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
    if (!name.startsWith("backup-gestor-")) continue;
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
    (/^backup-gestor-[\w.-]+\.json$/.test(filename) && !filename.includes(".."))
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
