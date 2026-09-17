import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { importBackupFromJson } from "@/src/features/backups/lib/import-database";
import {
  BACKUPS_DIR,
  ensureBackupsDir,
  MAIN_BACKUP_PATH,
} from "@/src/features/backups/lib/export-database";
import fs from "fs/promises";
import path from "path";

export const maxDuration = 300;
export const runtime = "nodejs";

function timestampSuffix(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

/**
 * Restaura la BD desde un JSON de backup (reemplazo total).
 * Acepta:
 * - multipart/form-data campo "file"
 * - application/json (cuerpo completo)
 * - text/plain (JSON crudo)
 *
 * Límite de body: ver next.config experimental.middlewareClientMaxBodySize (100mb).
 */
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    let raw: string;
    let sourceName = "upload.json";

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Subí un archivo JSON en el campo file" },
          { status: 400 },
        );
      }
      if (
        !file.name.toLowerCase().endsWith(".json") &&
        file.type !== "application/json"
      ) {
        return NextResponse.json(
          { error: "El archivo debe ser .json" },
          { status: 400 },
        );
      }
      sourceName = file.name || sourceName;
      raw = await file.text();
    } else {
      raw = await request.text();
      if (!raw.trim()) {
        return NextResponse.json({ error: "Cuerpo vacío" }, { status: 400 });
      }
    }

    if (raw.length < 2) {
      return NextResponse.json(
        {
          error:
            "JSON vacío o truncado. Si el archivo supera 10MB, reiniciá el gestor tras actualizar next.config (límite 100mb).",
        },
        { status: 400 },
      );
    }

    await ensureBackupsDir();
    const archived = `backup-gestor-import-${timestampSuffix()}.json`;
    await fs.writeFile(path.join(BACKUPS_DIR, archived), raw, "utf8");
    await fs.writeFile(MAIN_BACKUP_PATH, raw, "utf8");

    const summary = await importBackupFromJson(raw);

    return NextResponse.json({
      ok: true,
      message: "Base de datos restaurada desde el JSON",
      sourceName,
      archived,
      totalRows: summary.totalRows,
      counts: summary.counts,
    });
  } catch (error) {
    console.error("[backups/import]", error);
    const message =
      error instanceof Error ? error.message : "Error al importar el backup";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
