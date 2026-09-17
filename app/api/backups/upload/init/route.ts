import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { createUploadSession } from "@/src/features/backups/lib/chunked-upload";

export const runtime = "nodejs";

/** Inicia una subida por chunks (evita el límite de 10MB del middleware). */
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      fileName?: string;
      totalSize?: number;
      totalChunks?: number;
    };
    const meta = await createUploadSession({
      fileName: body.fileName || "backup.json",
      totalSize: Number(body.totalSize) || 0,
      totalChunks: Number(body.totalChunks) || 0,
    });
    return NextResponse.json({
      ok: true,
      uploadId: meta.uploadId,
      totalChunks: meta.totalChunks,
      chunkSizeHint: 2 * 1024 * 1024,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo iniciar la subida";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
