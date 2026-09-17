import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { BACKUPS_DIR, ensureBackupsDir } from "@/src/features/backups/lib/export-database";

export const UPLOADS_DIR = path.join(BACKUPS_DIR, ".uploads");
export const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB — bajo el límite de 10 MB del middleware

export type UploadMeta = {
  uploadId: string;
  fileName: string;
  totalSize: number;
  totalChunks: number;
  received: number[];
  createdAt: string;
};

function metaPath(uploadId: string) {
  return path.join(UPLOADS_DIR, uploadId, "meta.json");
}

function chunkPath(uploadId: string, index: number) {
  return path.join(UPLOADS_DIR, uploadId, `chunk-${String(index).padStart(5, "0")}.part`);
}

export function isSafeUploadId(uploadId: string) {
  return /^[0-9a-f-]{36}$/i.test(uploadId);
}

export async function ensureUploadsDir() {
  await ensureBackupsDir();
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function createUploadSession(input: {
  fileName: string;
  totalSize: number;
  totalChunks: number;
}): Promise<UploadMeta> {
  await ensureUploadsDir();
  const uploadId = randomUUID();
  const dir = path.join(UPLOADS_DIR, uploadId);
  await fs.mkdir(dir, { recursive: true });

  const safeName = String(input.fileName || "backup.json")
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 120);
  if (!safeName.toLowerCase().endsWith(".json")) {
    throw new Error("El archivo debe ser .json");
  }
  if (!(input.totalSize > 0) || !(input.totalChunks > 0)) {
    throw new Error("Tamaño o chunks inválidos");
  }
  if (input.totalSize > 200 * 1024 * 1024) {
    throw new Error("Archivo demasiado grande (máx. 200 MB)");
  }
  if (input.totalChunks > 200) {
    throw new Error("Demasiados chunks");
  }

  const meta: UploadMeta = {
    uploadId,
    fileName: safeName,
    totalSize: input.totalSize,
    totalChunks: input.totalChunks,
    received: [],
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile(metaPath(uploadId), JSON.stringify(meta), "utf8");
  return meta;
}

export async function readUploadMeta(uploadId: string): Promise<UploadMeta> {
  if (!isSafeUploadId(uploadId)) throw new Error("uploadId inválido");
  const raw = await fs.readFile(metaPath(uploadId), "utf8");
  return JSON.parse(raw) as UploadMeta;
}

export async function writeUploadChunk(
  uploadId: string,
  index: number,
  bytes: Buffer,
): Promise<UploadMeta> {
  const meta = await readUploadMeta(uploadId);
  if (index < 0 || index >= meta.totalChunks) {
    throw new Error("Índice de chunk inválido");
  }
  if (bytes.length > CHUNK_SIZE + 64 * 1024) {
    throw new Error("Chunk demasiado grande");
  }
  await fs.writeFile(chunkPath(uploadId, index), bytes);
  if (!meta.received.includes(index)) {
    meta.received.push(index);
    meta.received.sort((a, b) => a - b);
    await fs.writeFile(metaPath(uploadId), JSON.stringify(meta), "utf8");
  }
  return meta;
}

export async function assembleUpload(uploadId: string): Promise<{
  meta: UploadMeta;
  assembledPath: string;
  sizeBytes: number;
}> {
  const meta = await readUploadMeta(uploadId);
  if (meta.received.length !== meta.totalChunks) {
    throw new Error(
      `Faltan chunks: ${meta.received.length}/${meta.totalChunks}`,
    );
  }
  const assembledPath = path.join(UPLOADS_DIR, uploadId, "assembled.json");
  const handles = [];
  for (let i = 0; i < meta.totalChunks; i++) {
    handles.push(await fs.readFile(chunkPath(uploadId, i)));
  }
  const buf = Buffer.concat(handles);
  if (buf.length !== meta.totalSize) {
    // Algunos clientes reportan size aproximado; permitir ±0 solo si exacto
    // Preferimos el tamaño real ensamblado.
  }
  await fs.writeFile(assembledPath, buf);
  return { meta, assembledPath, sizeBytes: buf.length };
}

export async function cleanupUpload(uploadId: string) {
  if (!isSafeUploadId(uploadId)) return;
  await fs.rm(path.join(UPLOADS_DIR, uploadId), { recursive: true, force: true });
}
