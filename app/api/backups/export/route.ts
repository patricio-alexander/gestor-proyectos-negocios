import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { saveBackup } from "@/src/features/backups/lib/export-database";

/**
 * Exporta la BD actual a JSON, guarda copia + backup.json, y descarga el archivo.
 * Similar a EdDeli GET /comands/downloadBackup.
 */
export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const result = await saveBackup({ updateMain: true });
    const content = await import("fs/promises").then((fs) =>
      fs.readFile(result.storedPath),
    );

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Backup-Total-Rows": String(result.totalRows),
        "X-Backup-Size-Bytes": String(result.sizeBytes),
      },
    });
  } catch (error) {
    console.error("[backups/export]", error);
    const message =
      error instanceof Error ? error.message : "Error al exportar la base de datos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Solo guardar en disco (sin forzar descarga). */
export async function POST() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const result = await saveBackup({ updateMain: true });
    return NextResponse.json({
      ok: true,
      message: "Backup guardado",
      filename: result.filename,
      sizeBytes: result.sizeBytes,
      totalRows: result.totalRows,
      counts: result.counts,
      warnings: result.warnings ?? [],
    });
  } catch (error) {
    console.error("[backups/export POST]", error);
    const message =
      error instanceof Error ? error.message : "Error al guardar el backup";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
