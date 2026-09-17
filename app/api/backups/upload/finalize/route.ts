import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { importBackupFromJson } from "@/src/features/backups/lib/import-database";
import {
  BACKUPS_DIR,
  ensureBackupsDir,
  MAIN_BACKUP_PATH,
} from "@/src/features/backups/lib/export-database";
import {
  assembleUpload,
  cleanupUpload,
} from "@/src/features/backups/lib/chunked-upload";

export const runtime = "nodejs";
export const maxDuration = 300;

function timestampSuffix(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

/** Ensambla chunks, guarda en backups/ y restaura la BD. */
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  let uploadId = "";
  try {
    const body = (await request.json()) as {
      uploadId?: string;
      restore?: boolean;
    };
    uploadId = String(body.uploadId || "");
    if (!uploadId) {
      return NextResponse.json({ error: "uploadId requerido" }, { status: 400 });
    }

    const { meta, assembledPath, sizeBytes } = await assembleUpload(uploadId);
    const raw = await fs.readFile(assembledPath, "utf8");

    if (!raw.trim().startsWith("{")) {
      throw new Error("El archivo ensamblado no parece JSON de backup");
    }

    await ensureBackupsDir();
    const archived = `backup-gestor-import-${timestampSuffix()}.json`;
    await fs.writeFile(path.join(BACKUPS_DIR, archived), raw, "utf8");
    await fs.writeFile(MAIN_BACKUP_PATH, raw, "utf8");

    let summary: { totalRows: number; counts: Record<string, number> } | null =
      null;
    if (body.restore !== false) {
      summary = await importBackupFromJson(raw);
    }

    await cleanupUpload(uploadId);

    return NextResponse.json({
      ok: true,
      message:
        body.restore === false
          ? "JSON guardado en el servidor"
          : "Base de datos restaurada desde el JSON",
      sourceName: meta.fileName,
      archived,
      sizeBytes,
      sizeMB: Number((sizeBytes / (1024 * 1024)).toFixed(3)),
      totalRows: summary?.totalRows ?? null,
      counts: summary?.counts ?? null,
    });
  } catch (error) {
    console.error("[backups/upload/finalize]", error);
    if (uploadId) {
      try {
        await cleanupUpload(uploadId);
      } catch {
        /* ignore */
      }
    }
    const message =
      error instanceof Error ? error.message : "Error al finalizar la subida";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
