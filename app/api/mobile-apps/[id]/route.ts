import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import { revealSecret, sealSecret } from "@/src/shared/lib/secret-crypto";
import { generateMobileApiKey } from "@/src/features/mobile-apps/lib/mobile-app-helpers";
import { getMobileAppById } from "@/src/features/mobile-apps/lib/mobile-app-query";
import {
  softDeleteMobileControlApp,
  syncMobileControlAppName,
} from "@/src/features/mobile-apps/lib/mobile-control-app";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const id = Number((await context.params).id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const app = await getMobileAppById(id);
  if (!app) {
    return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
  }
  return NextResponse.json(app);
}

export async function PATCH(request: Request, context: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const id = Number((await context.params).id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const existing = await prisma.mobileApp.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      regenerate_api_key?: boolean;
    };

    const plainKey = body.regenerate_api_key
      ? generateMobileApiKey()
      : null;

    const app = await prisma.mobileApp.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.description !== undefined
          ? { description: body.description?.trim() || null }
          : {}),
        ...(plainKey ? { api_key: sealSecret(plainKey)! } : {}),
      },
    });

    if (body.name !== undefined) {
      await syncMobileControlAppName(app.app_id, app.name);
    }

    return NextResponse.json({
      id: app.id,
      key: app.key,
      name: app.name,
      description: app.description,
      api_key: revealSecret(app.api_key) || plainKey || app.api_key,
      api_key_encrypted: Boolean(app.api_key?.startsWith("v1:")),
      app_id: app.app_id,
      created_at: app.created_at.toISOString(),
      updated_at: app.updated_at.toISOString(),
      deleted_at: app.deleted_at?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("[mobile-apps] PATCH", err);
    return NextResponse.json(
      { error: "Error al actualizar app móvil" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const id = Number((await context.params).id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const existing = await prisma.mobileApp.findFirst({
    where: { id, deleted_at: null },
    select: { id: true, app_id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
  }

  await prisma.mobileApp.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
  await softDeleteMobileControlApp(existing.app_id);

  return NextResponse.json({ ok: true });
}
