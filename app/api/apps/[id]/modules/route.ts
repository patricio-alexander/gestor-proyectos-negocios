import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { pushEntitlementForAppId } from "@/src/shared/lib/push-entitlement-helpers";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const { id } = await params;
  const appId = Number(id);
  if (isNaN(appId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const app = await prisma.apps.findUnique({ where: { id: appId } });
    if (!app || app.deleted_at) {
      return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { module_ids } = body as { module_ids: number[] };

    if (!Array.isArray(module_ids)) {
      return NextResponse.json({ error: "module_ids debe ser un array" }, { status: 400 });
    }

    await prisma.appModule.deleteMany({ where: { app_id: appId } });

    if (module_ids.length > 0) {
      await prisma.appModule.createMany({
        data: module_ids.map((module_id) => ({ app_id: appId, module_id })),
      });
    }

    const pushResult = await pushEntitlementForAppId(appId);

    return NextResponse.json({
      ok: true,
      modules_count: module_ids.length,
      ...pushResult,
    });
  } catch (err) {
    console.error("Error updating app modules:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al actualizar módulos" },
      { status: 500 },
    );
  }
}
