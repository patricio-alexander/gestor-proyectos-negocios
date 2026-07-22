import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { isMobilePlatform } from "@/src/features/mobile-apps/lib/mobile-app-helpers";
import {
  toAbsoluteBundleUrl,
  validateMobileApiKey,
} from "@/src/features/mobile-apps/lib/mobile-api-auth";
import { upsertMobileDeviceHeartbeat } from "@/src/features/mobile-apps/lib/mobile-device";

/**
 * Check OTA para la app móvil.
 * Auth: Authorization: Bearer {mobile_app.api_key}
 * Query: platform=ios|android
 * Opcional (registro dispositivo):
 *   Headers X-Device-Id, X-App-Version
 *   Query device_id, app_version
 */
export async function GET(request: NextRequest) {
  const auth = await validateMobileApiKey(request);
  if (auth.error) return auth.error;

  const platformRaw = request.nextUrl.searchParams.get("platform") || "ios";
  if (!isMobilePlatform(platformRaw)) {
    return NextResponse.json(
      { error: "platform debe ser ios o android" },
      { status: 400 },
    );
  }

  const release = await prisma.mobileAppRelease.findFirst({
    where: {
      mobile_app_id: auth.mobile_app_id,
      platform: platformRaw,
      is_active: true,
      deleted_at: null,
    },
    orderBy: { published_at: "desc" },
  });

  if (!release) {
    return NextResponse.json(
      { error: "No hay release activo para esta plataforma" },
      { status: 404 },
    );
  }

  const deviceId =
    request.headers.get("x-device-id")?.trim() ||
    request.nextUrl.searchParams.get("device_id")?.trim() ||
    "";
  const appVersion =
    request.headers.get("x-app-version")?.trim() ||
    request.nextUrl.searchParams.get("app_version")?.trim() ||
    "";

  if (deviceId && appVersion) {
    try {
      await upsertMobileDeviceHeartbeat({
        mobile_app_id: auth.mobile_app_id,
        device_id: deviceId,
        platform: platformRaw,
        app_version: appVersion,
        latest_version_seen: release.version,
        os_version: request.headers.get("x-os-version"),
        model: request.headers.get("x-device-model"),
        label: request.headers.get("x-device-label"),
      });
    } catch {
      /* no bloquear OTA si falla el registro */
    }
  }

  return NextResponse.json({
    version: release.version,
    bundleUrl: toAbsoluteBundleUrl(request, release.bundle_path),
    mandatory: release.mandatory,
    platform: release.platform,
    releaseNotes: release.release_notes,
    appKey: auth.app_key,
  });
}
