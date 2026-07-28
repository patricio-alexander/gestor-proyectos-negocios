import type { MobilePlatform } from "@/src/features/mobile-apps/types";
import { prisma } from "@/src/shared/lib/prisma";

function parseVersionParts(version: string): number[] {
  const parts = String(version || "0.0.0")
    .trim()
    .split(/[.-]/)
    .filter((p) => /^\d+$/.test(p))
    .map(Number);
  return parts.length ? parts : [0, 0, 0];
}

/** 1 si a>b, -1 si a<b, 0 iguales */
export function compareAppVersions(a: string, b: string): number {
  const pa = parseVersionParts(a);
  const pb = parseVersionParts(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

export type DeviceHeartbeatInput = {
  mobile_app_id: number;
  device_id: string;
  platform: MobilePlatform;
  app_version: string;
  latest_version_seen?: string | null;
  os_version?: string | null;
  model?: string | null;
  label?: string | null;
};

export async function upsertMobileDeviceHeartbeat(input: DeviceHeartbeatInput) {
  const deviceId = String(input.device_id || "").trim().slice(0, 64);
  const appVersion = String(input.app_version || "").trim().slice(0, 50);
  if (!deviceId || !appVersion) {
    throw new Error("device_id y app_version son obligatorios");
  }

  const now = new Date();
  const data = {
    platform: input.platform,
    app_version: appVersion,
    latest_version_seen: input.latest_version_seen
      ? String(input.latest_version_seen).trim().slice(0, 50)
      : null,
    os_version: input.os_version
      ? String(input.os_version).trim().slice(0, 50)
      : null,
    model: input.model ? String(input.model).trim().slice(0, 120) : null,
    label: input.label ? String(input.label).trim().slice(0, 120) : null,
    last_seen_at: now,
    deleted_at: null,
  };

  return prisma.mobileDevice.upsert({
    where: {
      mobile_app_id_device_id: {
        mobile_app_id: input.mobile_app_id,
        device_id: deviceId,
      },
    },
    create: {
      mobile_app_id: input.mobile_app_id,
      device_id: deviceId,
      ...data,
    },
    update: data,
  });
}

export async function getActiveReleaseVersion(
  mobileAppId: number,
  platform: MobilePlatform,
): Promise<string | null> {
  const release = await prisma.mobileAppRelease.findFirst({
    where: {
      mobile_app_id: mobileAppId,
      platform,
      is_active: true,
      deleted_at: null,
    },
    orderBy: { published_at: "desc" },
    select: { version: true },
  });
  return release?.version ?? null;
}

export function mapMobileDevice(
  device: {
    id: number;
    mobile_app_id: number;
    device_id: string;
    platform: MobilePlatform;
    app_version: string;
    latest_version_seen: string | null;
    os_version: string | null;
    model: string | null;
    label: string | null;
    last_seen_at: Date;
    created_at: Date;
    updated_at: Date;
  },
  activeVersion: string | null,
) {
  const upToDate =
    activeVersion == null
      ? null
      : compareAppVersions(device.app_version, activeVersion) >= 0;
  const updateAvailable =
    activeVersion == null
      ? false
      : compareAppVersions(activeVersion, device.app_version) > 0;

  return {
    id: device.id,
    mobile_app_id: device.mobile_app_id,
    device_id: device.device_id,
    platform: device.platform,
    app_version: device.app_version,
    latest_version: activeVersion,
    latest_version_seen: device.latest_version_seen,
    os_version: device.os_version,
    model: device.model,
    label: device.label,
    up_to_date: upToDate,
    update_available: updateAvailable,
    last_seen_at: device.last_seen_at.toISOString(),
    created_at: device.created_at.toISOString(),
    updated_at: device.updated_at.toISOString(),
  };
}
