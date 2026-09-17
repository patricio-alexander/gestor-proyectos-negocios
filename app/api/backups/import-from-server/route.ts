import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { importBackupFromJson } from "@/src/features/backups/lib/import-database";
import {
  BACKUPS_DIR,
  ensureBackupsDir,
  isSafeBackupFilename,
  MAIN_BACKUP_PATH,
  readBackupFile,
} from "@/src/features/backups/lib/export-database";
import fs from "fs/promises";
import path from "path";

export const maxDuration = 300;
export const runtime = "nodejs";

/**
 * Restaura desde un JSON ya presente en la carpeta backups/ del servidor
 * (útil para archivos >10–40MB sin pasar por el body HTTP).
 *
 * Body: { "filename": "backup-gestor-….json" } o { "useMain": true }
 * También acepta colocar el archivo como backups/backup.json y { "useMain": true }.
 */
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      filename?: string;
      useMain?: boolean;
    };

    await ensureBackupsDir();

    let raw: string;
    let sourceName: string;

    if (body.useMain || body.filename === "backup.json") {
      raw = await fs.readFile(MAIN_BACKUP_PATH, "utf8");
      sourceName = "backup.json";
    } else if (body.filename && isSafeBackupFilename(body.filename)) {
      const { content } = await readBackupFile(body.filename);
      raw = content.toString("utf8");
      sourceName = body.filename;
    } else {
      return NextResponse.json(
        {
          error:
            'Indicá { "useMain": true } o { "filename": "backup-gestor-….json" } dentro de backups/',
        },
        { status: 400 },
      );
    }

    if (!raw.trim()) {
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
    }

    await fs.writeFile(MAIN_BACKUP_PATH, raw, "utf8");
    const summary = await importBackupFromJson(raw);

    return NextResponse.json({
      ok: true,
      message: `BD restaurada desde ${sourceName}`,
      sourceName,
      path: path.join(BACKUPS_DIR, sourceName === "backup.json" ? "backup.json" : sourceName),
      totalRows: summary.totalRows,
      counts: summary.counts,
    });
  } catch (error) {
    console.error("[backups/import-from-server]", error);
    const message =
      error instanceof Error ? error.message : "Error al importar desde servidor";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
