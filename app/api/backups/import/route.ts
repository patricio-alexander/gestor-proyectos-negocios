import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { importBackupFromJson } from "@/src/features/backups/lib/import-database";

export const maxDuration = 120;

/**
 * Restaura la BD desde un JSON de backup (reemplazo total).
 * Acepta multipart/form-data con campo "file" o body JSON directo.
 */
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    let raw: string;

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
      if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
        return NextResponse.json(
          { error: "El archivo debe ser .json" },
          { status: 400 },
        );
      }
      raw = await file.text();
    } else {
      raw = await request.text();
      if (!raw.trim()) {
        return NextResponse.json(
          { error: "Cuerpo vacío" },
          { status: 400 },
        );
      }
    }

    const summary = await importBackupFromJson(raw);

    return NextResponse.json({
      ok: true,
      message: "Base de datos restaurada desde el JSON",
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
