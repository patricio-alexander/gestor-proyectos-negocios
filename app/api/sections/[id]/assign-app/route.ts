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
    const sectionId = Number(id);
    const body = await request.json();
    const appId = Number(body.app_id);
    const assigned = Boolean(body.assigned);

    if (Number.isNaN(sectionId) || Number.isNaN(appId)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    const section = await prisma.section.findFirst({
      where: { id: sectionId, deleted_at: null },
      select: { id: true, module_id: true, name: true },
    });
    if (!section) {
      return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
    }

    const app = await prisma.apps.findFirst({
      where: { id: appId, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!app) {
      return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
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
            "El módulo padre no está asignado a esta app. Asigná el módulo primero.",
        },
        { status: 400 },
      );
    }

    if (assigned) {
      await prisma.appSection.upsert({
        where: {
          app_id_section_id: { app_id: appId, section_id: sectionId },
        },
        update: {},
        create: { app_id: appId, section_id: sectionId },
      });
    } else {
      await prisma.appSection.deleteMany({
        where: { app_id: appId, section_id: sectionId },
      });
    }

    const pushFields = await pushEntitlementForAppId(appId);

    return NextResponse.json({
      ok: true,
      assigned,
      app_id: appId,
      section_id: sectionId,
      app_name: app.name,
      ...pushFields,
    });
  } catch (err) {
    console.error("section assign-app", err);
    return NextResponse.json(
      { error: "Error al asignar sección a la app" },
      { status: 500 },
    );
  }
}
