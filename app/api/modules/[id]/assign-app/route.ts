import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { pushEntitlementForAppId } from "@/src/shared/lib/push-entitlement-helpers";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const moduleId = Number(id);
    const body = await request.json();
    const appId = Number(body.app_id);
    const assigned = Boolean(body.assigned);

    if (Number.isNaN(moduleId) || Number.isNaN(appId)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    const mod = await prisma.module.findFirst({
      where: { id: moduleId, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!mod) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    }

    const app = await prisma.apps.findFirst({
      where: { id: appId, deleted_at: null },
      select: { id: true, name: true, kind: true },
    });
    if (!app) {
      return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
    }

    if (assigned) {
      await prisma.appModule.upsert({
        where: {
          app_id_module_id: { app_id: appId, module_id: moduleId },
        },
        update: {},
        create: { app_id: appId, module_id: moduleId },
      });
    } else {
      await prisma.appModule.deleteMany({
        where: { app_id: appId, module_id: moduleId },
      });
    }

    const pushFields = await pushEntitlementForAppId(appId);

    return NextResponse.json({
      ok: true,
      assigned,
      app_id: appId,
      module_id: moduleId,
      app_name: app.name,
      ...pushFields,
    });
  } catch (err) {
    console.error("module assign-app", err);
    return NextResponse.json(
      { error: "Error al asignar módulo a la app" },
      { status: 500 },
    );
  }
}
