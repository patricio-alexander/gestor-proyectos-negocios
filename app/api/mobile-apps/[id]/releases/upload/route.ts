import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import {
  buildBundleRelativePath,
  isMobilePlatform,
  isValidSemverLike,
} from "@/src/features/mobile-apps/lib/mobile-app-helpers";
import { activateRelease } from "@/src/features/mobile-apps/lib/mobile-app-query";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const mobileAppId = Number((await context.params).id);
  if (!Number.isFinite(mobileAppId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const app = await prisma.mobileApp.findFirst({
    where: { id: mobileAppId, deleted_at: null },
  });
  if (!app) {
    return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const platformRaw = String(formData.get("platform") || "");
    const version = String(formData.get("version") || "").trim();
    const mandatory = String(formData.get("mandatory") || "") === "true";
    const activate = String(formData.get("activate") || "") === "true";
    const releaseNotesRaw = formData.get("release_notes");
    const releaseNotes =
      typeof releaseNotesRaw === "string" ? releaseNotesRaw.trim() || null : null;

    if (!file) {
      return NextResponse.json({ error: "Falta el archivo bundle" }, { status: 400 });
    }
    if (!isMobilePlatform(platformRaw)) {
      return NextResponse.json(
        { error: "platform debe ser ios o android" },
        { status: 400 },
      );
    }
    if (!isValidSemverLike(version)) {
      return NextResponse.json(
        { error: "version inválida (ej. 1.0.0)" },
        { status: 400 },
      );
    }

    const dup = await prisma.mobileAppRelease.findFirst({
      where: {
        mobile_app_id: mobileAppId,
        platform: platformRaw,
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

    const filename = file.name?.includes(".")
      ? path.basename(file.name)
      : "index.bundle";
    const bundlePath = buildBundleRelativePath(
      app.key,
      platformRaw,
      version,
      filename,
    );
    const absDir = path.join(
      process.cwd(),
      "public",
      "bundles",
      "mobile",
      app.key,
      platformRaw,
      version,
    );
    const absFile = path.join(absDir, path.basename(bundlePath));

    await mkdir(absDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absFile, buffer);

    const release = await prisma.mobileAppRelease.create({
      data: {
        mobile_app_id: mobileAppId,
        platform: platformRaw,
        version,
        bundle_path: bundlePath,
        mandatory,
        release_notes: releaseNotes,
        is_active: false,
      },
    });

    if (activate) {
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
        is_active: false,
        published_at: null,
        created_at: release.created_at.toISOString(),
        updated_at: release.updated_at.toISOString(),
        deleted_at: null,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[mobile-apps upload] POST", err);
    return NextResponse.json(
      { error: "Error al subir el bundle" },
      { status: 500 },
    );
  }
}
