import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import {
  activateRelease,
  listReleasesForApp,
} from "@/src/features/mobile-apps/lib/mobile-app-query";

type Ctx = { params: Promise<{ id: string; releaseId: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const { id, releaseId } = await context.params;
  const mobileAppId = Number(id);
  const rid = Number(releaseId);
  if (!Number.isFinite(mobileAppId) || !Number.isFinite(rid)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const existing = await prisma.mobileAppRelease.findFirst({
    where: { id: rid, mobile_app_id: mobileAppId, deleted_at: null },
  });
  if (!existing) {
    return NextResponse.json({ error: "Release no encontrado" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      mandatory?: boolean;
      release_notes?: string | null;
      activate?: boolean;
    };

    await prisma.mobileAppRelease.update({
      where: { id: rid },
      data: {
        ...(body.mandatory !== undefined ? { mandatory: Boolean(body.mandatory) } : {}),
        ...(body.release_notes !== undefined
          ? { release_notes: body.release_notes?.trim() || null }
          : {}),
      },
    });

    if (body.activate) {
      const activated = await activateRelease(rid, mobileAppId);
      return NextResponse.json(activated);
    }

    const all = await listReleasesForApp(mobileAppId);
    return NextResponse.json(all.find((r) => r.id === rid) ?? null);
  } catch (err) {
    console.error("[mobile-apps release] PATCH", err);
    return NextResponse.json(
      { error: "Error al actualizar release" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const { id, releaseId } = await context.params;
  const mobileAppId = Number(id);
  const rid = Number(releaseId);
  if (!Number.isFinite(mobileAppId) || !Number.isFinite(rid)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const existing = await prisma.mobileAppRelease.findFirst({
    where: { id: rid, mobile_app_id: mobileAppId, deleted_at: null },
    select: { id: true, is_active: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Release no encontrado" }, { status: 404 });
  }

  await prisma.mobileAppRelease.update({
    where: { id: rid },
    data: { deleted_at: new Date(), is_active: false },
  });

  return NextResponse.json({ ok: true });
}
