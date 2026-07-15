import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { pushEntitlementForAppId } from "@/src/shared/lib/push-entitlement-helpers";
import { toPushResponseFields } from "@/src/shared/lib/push-entitlement";

type Params = { params: Promise<{ id: string }> };

const STATUSES = new Set([
  "active",
  "development",
  "maintenance",
  "developer",
  "planned",
]);

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;
  const { id } = await params;
  const sectionId = Number(id);
  const rows = await prisma.sectionStatusOverride.findMany({
    where: { section_id: sectionId },
    include: { app: { select: { id: true, name: true, hash: true } } },
    orderBy: { app_id: "asc" },
  });
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      section_id: r.section_id,
      app_id: r.app_id,
      status: r.status,
      app_name: r.app.name,
      app_hash: r.app.hash,
    })),
  );
}

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const sectionId = Number(id);
    const body = await request.json();
    const appId = Number(body.app_id);
    const clear = Boolean(body.clear);

    const sec = await prisma.section.findFirst({
      where: { id: sectionId, deleted_at: null },
      select: { id: true },
    });
    if (!sec) {
      return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
    }
    const app = await prisma.apps.findFirst({
      where: { id: appId, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!app) {
      return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
    }

    if (clear || body.status == null || body.status === "") {
      const secFull = await prisma.section.findFirst({
        where: { id: sectionId, deleted_at: null },
        select: {
          key: true,
          module: { select: { key: true } },
        },
      });
      let sectionIds = [sectionId];
      if (secFull?.key) {
        const siblingModules = await prisma.module.findMany({
          where: { key: secFull.module.key, deleted_at: null },
          select: { id: true },
        });
        const siblings = await prisma.section.findMany({
          where: {
            module_id: { in: siblingModules.map((m) => m.id) },
            key: secFull.key,
            deleted_at: null,
          },
          select: { id: true },
        });
        sectionIds = siblings.map((s) => s.id);
      }
      await prisma.sectionStatusOverride.deleteMany({
        where: { section_id: { in: sectionIds }, app_id: appId },
      });
      const pushFields = toPushResponseFields(
        await pushEntitlementForAppId(appId),
      );
      return NextResponse.json({
        ok: true,
        cleared: true,
        section_id: sectionId,
        app_id: appId,
        ...pushFields,
      });
    }

    const status = String(body.status);
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const secFull = await prisma.section.findFirst({
      where: { id: sectionId, deleted_at: null },
      select: {
        key: true,
        module: { select: { key: true } },
      },
    });
    let targetIds = [sectionId];
    if (secFull?.key) {
      const siblingModules = await prisma.module.findMany({
        where: { key: secFull.module.key, deleted_at: null },
        select: { id: true },
      });
      const siblings = await prisma.section.findMany({
        where: {
          module_id: { in: siblingModules.map((m) => m.id) },
          key: secFull.key,
          deleted_at: null,
        },
        select: { id: true },
      });
      targetIds = siblings.map((s) => s.id);
    }

    let row = null as Awaited<
      ReturnType<typeof prisma.sectionStatusOverride.upsert>
    > | null;
    for (const sid of targetIds) {
      row = await prisma.sectionStatusOverride.upsert({
        where: {
          section_id_app_id: { section_id: sid, app_id: appId },
        },
        create: {
          section_id: sid,
          app_id: appId,
          status: status as
            | "active"
            | "development"
            | "maintenance"
            | "developer"
            | "planned",
        },
        update: {
          status: status as
            | "active"
            | "development"
            | "maintenance"
            | "developer"
            | "planned",
        },
      });
    }

    const pushFields = toPushResponseFields(
      await pushEntitlementForAppId(appId),
    );

    return NextResponse.json({
      id: row!.id,
      section_id: sectionId,
      app_id: appId,
      status: row!.status,
      app_name: app.name,
      ...pushFields,
    });
  } catch (err) {
    console.error("section status-override", err);
    return NextResponse.json(
      { error: "Error al guardar override" },
      { status: 500 },
    );
  }
}
