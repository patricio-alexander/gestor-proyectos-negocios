import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import {
  isMobilePlatform,
  isValidSemverLike,
} from "@/src/features/mobile-apps/lib/mobile-app-helpers";
import {
  activateRelease,
  listReleasesForApp,
} from "@/src/features/mobile-apps/lib/mobile-app-query";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const mobileAppId = Number((await context.params).id);
  if (!Number.isFinite(mobileAppId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const app = await prisma.mobileApp.findFirst({
    where: { id: mobileAppId, deleted_at: null },
    select: { id: true },
  });
  if (!app) {
    return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
  }

  const releases = await listReleasesForApp(mobileAppId);
  return NextResponse.json(releases);
}

export async function POST(request: Request, context: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const mobileAppId = Number((await context.params).id);
  if (!Number.isFinite(mobileAppId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const app = await prisma.mobileApp.findFirst({
    where: { id: mobileAppId, deleted_at: null },
    select: { id: true },
  });
  if (!app) {
    return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      platform?: string;
      version?: string;
      bundle_path?: string;
      mandatory?: boolean;
      release_notes?: string | null;
      activate?: boolean;
    };

    if (!isMobilePlatform(body.platform)) {
      return NextResponse.json(
        { error: "platform debe ser ios o android" },
        { status: 400 },
      );
    }
    const version = body.version?.trim() || "";
    if (!isValidSemverLike(version)) {
      return NextResponse.json(
        { error: "version inválida (usa semver, ej. 1.0.0)" },
        { status: 400 },
      );
    }
    const bundlePath = body.bundle_path?.trim() || "";
    if (!bundlePath.startsWith("/bundles/mobile/")) {
      return NextResponse.json(
        { error: "bundle_path inválido" },
        { status: 400 },
      );
    }

    const dup = await prisma.mobileAppRelease.findFirst({
      where: {
        mobile_app_id: mobileAppId,
        platform: body.platform,
        version,
        deleted_at: null,
      },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { error: "Ya existe esa versión para la plataforma" },
        { status: 409 },
      );
    }

    const release = await prisma.mobileAppRelease.create({
      data: {
        mobile_app_id: mobileAppId,
        platform: body.platform,
        version,
        bundle_path: bundlePath,
        mandatory: Boolean(body.mandatory),
        release_notes: body.release_notes?.trim() || null,
        is_active: false,
      },
    });

    if (body.activate) {
      const activated = await activateRelease(release.id, mobileAppId);
      return NextResponse.json(activated, { status: 201 });
    }

    return NextResponse.json(
      {
        id: release.id,
        mobile_app_id: release.mobile_app_id,
        platform: release.platform,
        version: release.version,
        bundle_path: release.bundle_path,
        mandatory: release.mandatory,
        release_notes: release.release_notes,
        is_active: release.is_active,
        published_at: null,
        created_at: release.created_at.toISOString(),
        updated_at: release.updated_at.toISOString(),
        deleted_at: null,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[mobile-apps releases] POST", err);
    return NextResponse.json(
      { error: "Error al crear release" },
      { status: 500 },
    );
  }
}
