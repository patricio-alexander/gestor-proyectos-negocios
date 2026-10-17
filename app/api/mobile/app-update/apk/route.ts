import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { prisma } from "@/src/shared/lib/prisma";
import { isMobilePlatform } from "@/src/features/mobile-apps/lib/mobile-app-helpers";
import { validateMobileApiKey } from "@/src/features/mobile-apps/lib/mobile-api-auth";

/**
 * Descarga APK OTA (stream desde disco).
 * Auth: Authorization Bearer o ?key=
 * Query: platform=android&version=x.y.z
 */
export async function GET(request: NextRequest) {
  const keyFromQuery = request.nextUrl.searchParams.get("key")?.trim();
  let authReq = request;
  if (keyFromQuery && !request.headers.get("Authorization")) {
    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${keyFromQuery}`);
    authReq = new NextRequest(request.url, { headers });
  }

  const auth = await validateMobileApiKey(authReq);
  if (auth.error) return auth.error;

  const platformRaw = request.nextUrl.searchParams.get("platform") || "android";
  const version = String(request.nextUrl.searchParams.get("version") || "").trim();

  if (!isMobilePlatform(platformRaw)) {
    return NextResponse.json(
      { error: "platform debe ser ios o android" },
      { status: 400 },
    );
  }
  if (platformRaw !== "android") {
    return NextResponse.json(
      { error: "APK solo disponible para Android" },
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
      apk_path: { not: null },
    },
  });

  if (!release?.apk_path) {
    return NextResponse.json({ error: "APK no encontrado" }, { status: 404 });
  }

  const rel = String(release.apk_path).replace(/^\/+/, "");
  const absFile = path.join(process.cwd(), "public", rel);

  if (!existsSync(absFile)) {
    console.error("[ota apk] archivo ausente:", absFile);
    return NextResponse.json(
      { error: "Archivo APK no encontrado en el servidor" },
      { status: 404 },
    );
  }

  const st = statSync(absFile);
  if (!st.isFile() || st.size <= 0) {
    return NextResponse.json({ error: "APK vacío o inválido" }, { status: 404 });
  }

  const filename = path.basename(absFile) || "app-release.apk";
  const nodeStream = createReadStream(absFile);
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Length": String(st.size),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
