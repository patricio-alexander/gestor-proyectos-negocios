import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import {
  buildApkRelativePath,
  buildBundleRelativePath,
  isMobilePlatform,
  isValidSemverLike,
} from "@/src/features/mobile-apps/lib/mobile-app-helpers";
import { activateRelease } from "@/src/features/mobile-apps/lib/mobile-app-query";

type Ctx = { params: Promise<{ id: string }> };

function detectArtifact(file: File, artifactRaw: string): "bundle" | "apk" {
  const a = String(artifactRaw || "").trim().toLowerCase();
  if (a === "apk" || a === "bundle") return a;
  const name = String(file.name || "").toLowerCase();
  if (name.endsWith(".apk")) return "apk";
  return "bundle";
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
    const artifact = file
      ? detectArtifact(file, String(formData.get("artifact") || ""))
      : "bundle";
    const releaseNotesRaw = formData.get("release_notes");
    const releaseNotes =
      typeof releaseNotesRaw === "string" ? releaseNotesRaw.trim() || null : null;

    if (!file) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }
    if (!isMobilePlatform(platformRaw)) {
      return NextResponse.json(
        { error: "platform debe ser ios o android" },
        { status: 400 },
      );
    }
    if (artifact === "apk" && platformRaw !== "android") {
      return NextResponse.json(
        { error: "APK solo se sube para Android" },
        { status: 400 },
      );
    }
    if (!isValidSemverLike(version)) {
      return NextResponse.json(
        { error: "version inválida (ej. 1.0.0 o 0.0.0.4)" },
        { status: 400 },
      );
    }

    const existing = await prisma.mobileAppRelease.findFirst({
      where: {
        mobile_app_id: mobileAppId,
        platform: platformRaw,
        version,
        deleted_at: null,
      },
    });

    const filename = file.name?.includes(".")
      ? path.basename(file.name)
      : artifact === "apk"
        ? "app-release.apk"
        : "index.bundle";

    const relativePath =
      artifact === "apk"
        ? buildApkRelativePath(app.key, platformRaw, version, filename)
        : buildBundleRelativePath(app.key, platformRaw, version, filename);

    const absDir = path.join(
      process.cwd(),
      "public",
      "bundles",
      "mobile",
      app.key,
      platformRaw,
      version,
    );
    const absFile = path.join(absDir, path.basename(relativePath));

    await mkdir(absDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absFile, buffer);

    // Si suben APK sin bundle, heredar bundle del release activo previo (misma plataforma).
    let inheritBundle: string | null = null;
    if (artifact === "apk" && !existing?.bundle_path) {
      const prev = await prisma.mobileAppRelease.findFirst({
        where: {
          mobile_app_id: mobileAppId,
          platform: platformRaw,
          deleted_at: null,
          bundle_path: { not: null },
          NOT: existing ? { id: existing.id } : undefined,
        },
        orderBy: [{ is_active: "desc" }, { published_at: "desc" }, { id: "desc" }],
      });
      inheritBundle = prev?.bundle_path ?? null;
    }

    let release;
    if (existing) {
      release = await prisma.mobileAppRelease.update({
        where: { id: existing.id },
        data: {
          ...(artifact === "apk"
            ? { apk_path: relativePath }
            : { bundle_path: relativePath }),
          ...(artifact === "apk" && !existing.bundle_path && inheritBundle
            ? { bundle_path: inheritBundle }
            : {}),
          mandatory,
          release_notes: releaseNotes,
        },
      });
    } else {
      release = await prisma.mobileAppRelease.create({
        data: {
          mobile_app_id: mobileAppId,
          platform: platformRaw,
          version,
          bundle_path: artifact === "bundle" ? relativePath : inheritBundle,
          apk_path: artifact === "apk" ? relativePath : null,
          mandatory,
          release_notes: releaseNotes,
          is_active: false,
        },
      });
    }

    if (activate) {
      const activated = await activateRelease(release.id, mobileAppId);
      return NextResponse.json(activated, { status: existing ? 200 : 201 });
    }

    return NextResponse.json(
      {
        id: release.id,
        mobile_app_id: release.mobile_app_id,
        platform: release.platform,
        version: release.version,
        bundle_path: release.bundle_path,
        apk_path: release.apk_path,
        mandatory: release.mandatory,
        release_notes: release.release_notes,
        is_active: release.is_active,
        published_at: release.published_at?.toISOString?.() ?? release.published_at,
        created_at: release.created_at.toISOString(),
        updated_at: release.updated_at.toISOString(),
        deleted_at: null,
      },
      { status: existing ? 200 : 201 },
    );
  } catch (err) {
    console.error("[mobile-apps upload] POST", err);
    return NextResponse.json(
      { error: "Error al subir el archivo" },
      { status: 500 },
    );
  }
}
