import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { readBackupFile } from "@/src/features/backups/lib/export-database";

type Params = { params: Promise<{ filename: string }> };

/** Descarga una copia guardada (backup-gestor-….json). */
export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { filename } = await params;
    const { content } = await readBackupFile(filename);
    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Archivo no encontrado";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
