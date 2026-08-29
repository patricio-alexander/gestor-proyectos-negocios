import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import { revealSecret, sealSecret } from "@/src/shared/lib/secret-crypto";
import {
  generateMobileApiKey,
  normalizeAppKey,
} from "@/src/features/mobile-apps/lib/mobile-app-helpers";
import { ensureMobileControlApp } from "@/src/features/mobile-apps/lib/mobile-control-app";
import { listMobileApps } from "@/src/features/mobile-apps/lib/mobile-app-query";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const apps = await listMobileApps();
    return NextResponse.json(apps);
  } catch (err) {
    console.error("[mobile-apps] GET", err);
    return NextResponse.json(
      { error: "Error al listar apps móviles" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      key?: string;
      name?: string;
      description?: string | null;
    };

    const key = normalizeAppKey(body.key || "");
    const name = body.name?.trim() || "";

    if (!key || key.length < 2) {
      return NextResponse.json(
        { error: "La clave (key) es obligatoria (ej. chilepan)" },
        { status: 400 },
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 },
      );
    }

    const exists = await prisma.mobileApp.findFirst({
      where: { key, deleted_at: null },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Ya existe una app móvil con esa clave" },
        { status: 409 },
      );
    }

    const plainKey = generateMobileApiKey();
    const app = await prisma.mobileApp.create({
      data: {
        key,
        name,
        description: body.description?.trim() || null,
        api_key: sealSecret(plainKey)!,
      },
    });

    const controlAppId = await ensureMobileControlApp(app);

    return NextResponse.json(
      {
        id: app.id,
        key: app.key,
        name: app.name,
        description: app.description,
        api_key: revealSecret(app.api_key) || plainKey,
        api_key_encrypted: Boolean(app.api_key?.startsWith("v1:")),
        app_id: controlAppId,
        created_at: app.created_at.toISOString(),
        updated_at: app.updated_at.toISOString(),
        deleted_at: null,
        releases_count: 0,
        active_releases: [],
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[mobile-apps] POST", err);
    return NextResponse.json(
      { error: "Error al crear app móvil" },
      { status: 500 },
    );
  }
}
