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

  const rows = await prisma.appSection.findMany({
    where: { section_id: sectionId },
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
      const existing = await prisma.appSection.findUnique({
        where: { app_id_section_id: { app_id: appId, section_id: sectionId } },
      });
      if (!existing) {
        return NextResponse.json(
          {
            error:
              "La sección no está asignada a esta app. Asignalá primero para cambiar el estado.",
          },
          { status: 400 },
        );
      }
      await prisma.appSection.update({
        where: { app_id_section_id: { app_id: appId, section_id: sectionId } },
        data: { status: null },
      });
      const pushFields = toPushResponseFields(
        await pushEntitlementForAppId(appId),
      );
      return NextResponse.json({ ok: true, cleared: true, ...pushFields });
    }

    const status = String(body.status);
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const existing = await prisma.appSection.findUnique({
      where: { app_id_section_id: { app_id: appId, section_id: sectionId } },
    });
    if (!existing) {
      return NextResponse.json(
        {
          error:
            "La sección no está asignada a esta app. Asignalá primero para cambiar el estado.",
        },
        { status: 400 },
      );
    }

    await prisma.appSection.update({
      where: { app_id_section_id: { app_id: appId, section_id: sectionId } },
      data: {
        status: status as
          | "active"
          | "development"
          | "maintenance"
          | "developer"
          | "planned",
      },
    });

    const pushFields = toPushResponseFields(
      await pushEntitlementForAppId(appId),
    );

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
