import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { saveBackup } from "@/src/features/backups/lib/export-database";

function wantsTelemetry(request: Request, body?: { includeTelemetry?: boolean }) {
  if (body?.includeTelemetry === true) return true;
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("includeTelemetry");
    return q === "1" || q === "true" || q === "yes";
  } catch {
    return false;
  }
}

function downloadFilename(includeTelemetry: boolean) {
  return includeTelemetry
    ? "backup-RAPTOR-SOLUTIONS-full.json"
    : "backup-RAPTOR-SOLUTIONS.json";
}

/**
 * Exporta la BD actual a JSON, guarda copia + backup.json, y descarga el archivo.
 * Query: ?includeTelemetry=1 → incluye Event + AppLoad* (puede pesar decenas de MB).
 */
export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const includeTelemetry = wantsTelemetry(request);

  try {
    const result = await saveBackup({ updateMain: true, includeTelemetry });
    const content = await import("fs/promises").then((fs) =>
      fs.readFile(result.storedPath),
    );

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${downloadFilename(includeTelemetry)}"`,
        "X-Backup-Total-Rows": String(result.totalRows),
        "X-Backup-Size-Bytes": String(result.sizeBytes),
        "X-Backup-Include-Telemetry": includeTelemetry ? "1" : "0",
      },
    });
  } catch (error) {
    console.error("[backups/export]", error);
    const message =
      error instanceof Error ? error.message : "Error al exportar la base de datos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Solo guardar en disco (sin forzar descarga). Body opcional: { includeTelemetry: true } */
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  let body: { includeTelemetry?: boolean } = {};
  try {
    body = (await request.json()) as { includeTelemetry?: boolean };
  } catch {
    body = {};
  }
  const includeTelemetry = wantsTelemetry(request, body);

  try {
    const result = await saveBackup({ updateMain: true, includeTelemetry });
    return NextResponse.json({
      ok: true,
      message: includeTelemetry
        ? "Backup completo guardado (con telemetría)"
        : "Backup guardado (sin telemetría)",
      filename: result.filename,
      sizeBytes: result.sizeBytes,
      totalRows: result.totalRows,
      counts: result.counts,
      includeTelemetry,
      warnings: result.warnings ?? [],
    });
  } catch (error) {
    console.error("[backups/export POST]", error);
    const message =
      error instanceof Error ? error.message : "Error al guardar el backup";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
