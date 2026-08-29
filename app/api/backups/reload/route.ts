import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { reloadFromMainBackup } from "@/src/features/backups/lib/import-database";

export const maxDuration = 180;

/** Recarga la BD desde backups/backup.json (como Scheduly / EdDeli). */
export async function POST() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const summary = await reloadFromMainBackup();
    return NextResponse.json({
      ok: true,
      message: "Base de datos restaurada desde backup.json",
      totalRows: summary.totalRows,
      counts: summary.counts,
    });
  } catch (error) {
    console.error("POST /api/backups/reload", error);
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo recargar. Verifica que exista backup.json";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
