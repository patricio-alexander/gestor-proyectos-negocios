import { prisma } from "@/src/shared/lib/prisma";
import type { MobilePlatform } from "../types";
import { ensureMobileControlApp } from "./mobile-control-app";

function mapMobileApp(
  app: {
    id: number;
    key: string;
    name: string;
    description: string | null;
    api_key: string;
    app_id: number | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
  },
  extras?: {
    releases_count?: number;
    active_releases?: {
      platform: MobilePlatform;
      version: string;
      mandatory: boolean;
    }[];
  },
) {
  return {
    id: app.id,
    key: app.key,
    name: app.name,
    description: app.description,
    api_key: app.api_key,
    app_id: app.app_id,
    created_at: app.created_at.toISOString(),
    updated_at: app.updated_at.toISOString(),
    deleted_at: app.deleted_at?.toISOString() ?? null,
    releases_count: extras?.releases_count ?? 0,
    active_releases: extras?.active_releases ?? [],
  };
}

export async function listMobileApps() {
  const apps = await prisma.mobileApp.findMany({
    where: { deleted_at: null },
    orderBy: { name: "asc" },
    include: {
      releases: {
        where: { deleted_at: null, is_active: true },
        select: {
          platform: true,
          version: true,
          mandatory: true,
        },
      },
      _count: {
        select: {
          releases: { where: { deleted_at: null } },
        },
      },
    },
  });

  const out = [];
  for (const app of apps) {
    const controlAppId = await ensureMobileControlApp(app);
    out.push(
      mapMobileApp(
        { ...app, app_id: controlAppId },
        {
          releases_count: app._count.releases,
          active_releases: app.releases.map((r) => ({
            platform: r.platform as MobilePlatform,
            version: r.version,
            mandatory: r.mandatory,
          })),
        },
      ),
    );
  }
  return out;
}

export async function getMobileAppById(id: number) {
  const app = await prisma.mobileApp.findFirst({
    where: { id, deleted_at: null },
  });
  if (!app) return null;
  const controlAppId = await ensureMobileControlApp(app);
  return mapMobileApp({ ...app, app_id: controlAppId });
}

export async function listReleasesForApp(mobileAppId: number) {
  const releases = await prisma.mobileAppRelease.findMany({
    where: { mobile_app_id: mobileAppId, deleted_at: null },
    orderBy: [{ platform: "asc" }, { created_at: "desc" }],
  });

  return releases.map((r) => ({
    id: r.id,
    mobile_app_id: r.mobile_app_id,
    platform: r.platform as MobilePlatform,
    version: r.version,
    bundle_path: r.bundle_path,
    mandatory: r.mandatory,
    release_notes: r.release_notes,
    is_active: r.is_active,
    published_at: r.published_at?.toISOString() ?? null,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
    deleted_at: r.deleted_at?.toISOString() ?? null,
  }));
}

/** Activa un release y desactiva los demás de la misma app+plataforma. */
export async function activateRelease(releaseId: number, mobileAppId: number) {
  const release = await prisma.mobileAppRelease.findFirst({
    where: { id: releaseId, mobile_app_id: mobileAppId, deleted_at: null },
  });
  if (!release) return null;

  await prisma.$transaction([
    prisma.mobileAppRelease.updateMany({
      where: {
        mobile_app_id: mobileAppId,
        platform: release.platform,
        deleted_at: null,
        is_active: true,
      },
      data: { is_active: false },
    }),
    prisma.mobileAppRelease.update({
      where: { id: releaseId },
      data: {
        is_active: true,
        published_at: release.published_at ?? new Date(),
      },
    }),
  ]);

  return listReleasesForApp(mobileAppId).then(
    (all) => all.find((r) => r.id === releaseId) ?? null,
  );
}
