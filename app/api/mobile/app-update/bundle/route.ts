import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { prisma } from "@/src/shared/lib/prisma";
import { isMobilePlatform } from "@/src/features/mobile-apps/lib/mobile-app-helpers";
import { validateMobileApiKey } from "@/src/features/mobile-apps/lib/mobile-api-auth";

/**
 * Descarga el bundle OTA (stream desde disco).
 * Auth: Authorization: Bearer {api_key}  O  query ?key={api_key}
 * Query: platform=ios|android&version=x.y.z
 *
 * Evita depender de archivos estáticos en /public (en prod suelen dar 404
 * si se subieron en runtime y Apache/Next no los sirve).
 */
export async function GET(request: NextRequest) {
  // Apps viejas descargan sin headers: aceptamos ?key= en la URL del check OTA.
  const keyFromQuery = request.nextUrl.searchParams.get("key")?.trim();
  let authReq = request;
  if (keyFromQuery && !request.headers.get("Authorization")) {
    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${keyFromQuery}`);
    authReq = new NextRequest(request.url, { headers });
  }

  const auth = await validateMobileApiKey(authReq);
  if (auth.error) return auth.error;

  const platformRaw = request.nextUrl.searchParams.get("platform") || "";
  const version = String(request.nextUrl.searchParams.get("version") || "").trim();

  if (!isMobilePlatform(platformRaw)) {
    return NextResponse.json(
      { error: "platform debe ser ios o android" },
      { status: 400 },
    );
  }
  if (!version) {
    return NextResponse.json({ error: "version es obligatoria" }, { status: 400 });
  }

  const release = await prisma.mobileAppRelease.findFirst({
    where: {
      mobile_app_id: auth.mobile_app_id,
      platform: platformRaw,
      version,
      deleted_at: null,
    },
  });

  if (!release) {
    return NextResponse.json({ error: "Release no encontrado" }, { status: 404 });
  }

  const rel = String(release.bundle_path || "").replace(/^\/+/, "");
  const absFile = path.join(process.cwd(), "public", rel);

  if (!existsSync(absFile)) {
    console.error("[ota bundle] archivo ausente:", absFile, "db:", release.bundle_path);
    return NextResponse.json(
      {
        error: "Archivo del bundle no encontrado en el servidor",
        hint: "Vuelve a subir el release (el archivo debe quedar en public/bundles/mobile/...)",
      },
      { status: 404 },
    );
  }

  const st = statSync(absFile);
  if (!st.isFile() || st.size <= 0) {
    return NextResponse.json({ error: "Bundle vacío o inválido" }, { status: 404 });
  }

  const filename = path.basename(absFile) || "index.bundle";
  const nodeStream = createReadStream(absFile);
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Content-Length": String(st.size),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
