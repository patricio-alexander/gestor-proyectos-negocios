import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { writeUploadChunk } from "@/src/features/backups/lib/chunked-upload";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Recibe un chunk binario (< ~2.5 MB). Query: uploadId, index */
export async function PUT(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const url = new URL(request.url);
    const uploadId = url.searchParams.get("uploadId") || "";
    const index = Number(url.searchParams.get("index"));
    if (!uploadId || !Number.isFinite(index)) {
      return NextResponse.json(
        { error: "uploadId e index requeridos" },
        { status: 400 },
      );
    }

    const ab = await request.arrayBuffer();
    const bytes = Buffer.from(ab);
    if (!bytes.length) {
      return NextResponse.json({ error: "Chunk vacío" }, { status: 400 });
    }

    const meta = await writeUploadChunk(uploadId, index, bytes);
    return NextResponse.json({
      ok: true,
      received: meta.received.length,
      totalChunks: meta.totalChunks,
      percent: Math.round((meta.received.length / meta.totalChunks) * 100),
    });
  } catch (error) {
    console.error("[backups/upload/chunk]", error);
    const message =
      error instanceof Error ? error.message : "Error al guardar chunk";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
