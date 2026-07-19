import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { getModuleAccessAssignments } from "@/src/features/modules/lib/module-access-query";
import { pushEntitlementForAppId } from "@/src/shared/lib/push-entitlement-helpers";

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
  const moduleId = Number(id);

  const rows = await getModuleAccessAssignments(moduleId);

  return NextResponse.json(rows);
}

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
      const existing = await prisma.appModule.findUnique({
        where: { app_id_module_id: { app_id: appId, module_id: moduleId } },
      });
      if (!existing) {
        return NextResponse.json(
          {
            error:
              "El módulo no está asignado a esta app. Asignalo primero para cambiar el estado.",
          },
          { status: 400 },
        );
      }
      await prisma.appModule.update({
        where: { app_id_module_id: { app_id: appId, module_id: moduleId } },
        data: { status: null },
      });
      const pushFields = await pushEntitlementForAppId(appId);
      return NextResponse.json({ ok: true, cleared: true, ...pushFields });
    }

    const status = String(body.status);
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const existing = await prisma.appModule.findUnique({
      where: { app_id_module_id: { app_id: appId, module_id: moduleId } },
    });
    if (!existing) {
      return NextResponse.json(
        {
          error:
            "El módulo no está asignado a esta app. Asignalo primero para cambiar el estado.",
        },
        { status: 400 },
      );
    }

    await prisma.appModule.update({
      where: { app_id_module_id: { app_id: appId, module_id: moduleId } },
      data: {
        status: status as
          | "active"
          | "development"
          | "maintenance"
          | "developer"
          | "planned",
      },
    });

    const pushFields = await pushEntitlementForAppId(appId);

    return NextResponse.json({
      ok: true,
      app_id: appId,
      status,
      app_name: app.name,
      ...pushFields,
    });
  } catch (err) {
    console.error("module app-status", err);
    return NextResponse.json(
      { error: "Error al guardar estado por app" },
      { status: 500 },
    );
  }
}
