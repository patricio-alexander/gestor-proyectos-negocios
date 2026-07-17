import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import {
  pushEntitlementForAppId,
  buildEntitlementForAppId,
  moduleSectionsFromEntitlement,
} from "@/src/shared/lib/push-entitlement-helpers";
import { toPushResponseFields } from "@/src/shared/lib/push-entitlement";

async function pushWithModulePreview(appId: number, moduleId: number) {
  const pushFields = toPushResponseFields(await pushEntitlementForAppId(appId));
  const payload = await buildEntitlementForAppId(appId);
  return {
    ...pushFields,
    entitlement_module: moduleSectionsFromEntitlement(payload, moduleId),
  };
}

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

  const rows = await prisma.appSection.findMany({
    where: { section_id: sectionId, status: { not: null } },
    select: {
      app_id: true,
      status: true,
      app: { select: { name: true, hash: true } },
    },
  });

  return NextResponse.json(
    rows.map((r) => ({
      app_id: r.app_id,
      status: r.status,
      app_name: r.app.name,
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

    const section = await prisma.section.findFirst({
      where: { id: sectionId, deleted_at: null },
      select: { module_id: true },
    });
    if (!section) {
      return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
    }

    const moduleAssigned = await prisma.appModule.findUnique({
      where: {
        app_id_module_id: { app_id: appId, module_id: section.module_id },
      },
    });
    if (!moduleAssigned) {
      return NextResponse.json(
        {
          error:
            "El módulo padre no está asignado a esta app. Asigná el módulo a la app primero.",
        },
        { status: 400 },
      );
    }

    if (clear || body.status == null || body.status === "") {
      await prisma.appSection.deleteMany({
        where: { app_id: appId, section_id: sectionId },
      });
      const pushFields = await pushWithModulePreview(appId, section.module_id);
      return NextResponse.json({ ok: true, cleared: true, ...pushFields });
    }

    const status = String(body.status);
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    await prisma.appSection.upsert({
      where: {
        app_id_section_id: { app_id: appId, section_id: sectionId },
      },
      create: {
        app_id: appId,
        section_id: sectionId,
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

    const pushFields = await pushWithModulePreview(appId, section.module_id);

    return NextResponse.json({
      ok: true,
      app_id: appId,
      status,
      app_name: app.name,
      ...pushFields,
    });
  } catch (err) {
    console.error("section app-status", err);
    return NextResponse.json(
      { error: "Error al guardar estado por app" },
      { status: 500 },
    );
  }
}
