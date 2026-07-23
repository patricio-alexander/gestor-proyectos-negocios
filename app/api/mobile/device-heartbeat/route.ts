import { NextRequest, NextResponse } from "next/server";
import { isMobilePlatform } from "@/src/features/mobile-apps/lib/mobile-app-helpers";
import { validateMobileApiKey } from "@/src/features/mobile-apps/lib/mobile-api-auth";
import {
  getActiveReleaseVersion,
  mapMobileDevice,
  upsertMobileDeviceHeartbeat,
} from "@/src/features/mobile-apps/lib/mobile-device";

/**
 * Heartbeat de dispositivo.
 * Auth: Bearer {mobile_app.api_key}
 * Body JSON: { device_id, platform, app_version, os_version?, model?, label? }
 */
export async function POST(request: NextRequest) {
  const auth = await validateMobileApiKey(request);
  if (auth.error) return auth.error;

  let body: {
    device_id?: string;
    platform?: string;
    app_version?: string;
    os_version?: string | null;
    model?: string | null;
    label?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const platformRaw = body.platform || "android";
  if (!isMobilePlatform(platformRaw)) {
    return NextResponse.json(
      { error: "platform debe ser ios o android" },
      { status: 400 },
    );
  }

  const deviceId = String(body.device_id || "").trim();
  const appVersion = String(body.app_version || "").trim();
  if (!deviceId || !appVersion) {
    return NextResponse.json(
      { error: "device_id y app_version son obligatorios" },
      { status: 400 },
    );
  }

  const latest = await getActiveReleaseVersion(auth.mobile_app_id, platformRaw);

  try {
    const row = await upsertMobileDeviceHeartbeat({
      mobile_app_id: auth.mobile_app_id,
      device_id: deviceId,
      platform: platformRaw,
      app_version: appVersion,
      latest_version_seen: latest,
      os_version: body.os_version ?? null,
      model: body.model ?? null,
      label: body.label ?? null,
    });

    const mapped = mapMobileDevice(row, latest);
    return NextResponse.json({
      ok: true,
      app_key: auth.app_key,
      ...mapped,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Error al registrar dispositivo",
      },
      { status: 400 },
    );
  }
}
