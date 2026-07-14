import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { readBackupFile } from "@/src/features/backups/lib/export-database";

/** Descarga el backup.json fijo (sin re-volcar BD). */
export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { content } = await readBackupFile("backup.json");
    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="backup.json"',
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No existe backup.json en el servidor" },
      { status: 404 },
    );
  }
}
