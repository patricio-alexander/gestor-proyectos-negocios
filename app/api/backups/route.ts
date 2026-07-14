import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import {
  getMainBackupInfo,
  listStoredBackups,
} from "@/src/features/backups/lib/export-database";

/** Información del backup fijo + copias guardadas. */
export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const [main, stored] = await Promise.all([
      getMainBackupInfo(),
      listStoredBackups(),
    ]);
    return NextResponse.json({ main, stored });
  } catch {
    return NextResponse.json(
      { error: "Error al listar backups" },
      { status: 500 },
    );
  }
}
