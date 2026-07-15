import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import {
  pushEntitlementForAppId,
} from "@/src/shared/lib/push-entitlement-helpers";
import { toPushResponseFields } from "@/src/shared/lib/push-entitlement";

type Params = { params: Promise<{ id: string }> };

const STATUSES = new Set([
  "active",
  "development",
  "maintenance",
  "developer",
  "planned",
]);

/** Lista overrides del módulo. */
export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;
  const { id } = await params;
  const moduleId = Number(id);
  const rows = await prisma.moduleStatusOverride.findMany({
    where: { module_id: moduleId },
    include: { app: { select: { id: true, name: true, hash: true } } },
    orderBy: { app_id: "asc" },
  });
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      module_id: r.module_id,
      app_id: r.app_id,
      status: r.status,
      app_name: r.app.name,
      app_hash: r.app.hash,
    })),
  );
}

/**
 * Upsert override por app.
 * Body: { app_id, status } — status null/omitido con clear=true elimina.
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const moduleId = Number(id);
    const body = await request.json();
    const appId = Number(body.app_id);
    const clear = Boolean(body.clear);

    const mod = await prisma.module.findFirst({
      where: { id: moduleId, deleted_at: null },
      select: { id: true },
    });
    if (!mod) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    }
    const app = await prisma.apps.findFirst({
      where: { id: appId, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!app) {
      return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
    }

    if (clear || body.status == null || body.status === "") {
      const modFull = await prisma.module.findFirst({
        where: { id: moduleId, deleted_at: null },
        select: { key: true },
      });
      const siblingIds = modFull
        ? (
            await prisma.module.findMany({
              where: { key: modFull.key, deleted_at: null },
              select: { id: true },
            })
          ).map((m) => m.id)
        : [moduleId];
      await prisma.moduleStatusOverride.deleteMany({
        where: { module_id: { in: siblingIds }, app_id: appId },
      });
      const pushFields = toPushResponseFields(
        await pushEntitlementForAppId(appId),
      );
      return NextResponse.json({
        ok: true,
        cleared: true,
        module_id: moduleId,
        app_id: appId,
        ...pushFields,
      });
    }

    const status = String(body.status);
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const modFull = await prisma.module.findFirst({
      where: { id: moduleId, deleted_at: null },
      select: { key: true },
    });
    const siblings = modFull
      ? await prisma.module.findMany({
          where: { key: modFull.key, deleted_at: null },
          select: { id: true },
        })
      : [{ id: moduleId }];

    let row = null as Awaited<
      ReturnType<typeof prisma.moduleStatusOverride.upsert>
    > | null;
    for (const s of siblings) {
      row = await prisma.moduleStatusOverride.upsert({
        where: {
          module_id_app_id: { module_id: s.id, app_id: appId },
        },
        create: {
          module_id: s.id,
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
      module_id: moduleId,
      app_id: appId,
      status: row!.status,
      app_name: app.name,
      ...pushFields,
    });
  } catch (err) {
    console.error("module status-override", err);
    return NextResponse.json(
      { error: "Error al guardar override" },
      { status: 500 },
    );
  }
}
