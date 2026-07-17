import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { getModuleAccessPanelData } from "@/src/features/modules/lib/module-access-query";
import { prisma } from "@/src/shared/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const { id } = await params;
  const moduleId = Number(id);
  if (!Number.isFinite(moduleId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const mod = await prisma.module.findFirst({
    where: { id: moduleId, deleted_at: null },
    select: { id: true },
  });
  if (!mod) {
    return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
  }

  const appIdParam = new URL(request.url).searchParams.get("app_id");
  const appId =
    appIdParam != null && appIdParam !== "" ? Number(appIdParam) : null;

  if (appId != null && !Number.isFinite(appId)) {
    return NextResponse.json({ error: "app_id inválido" }, { status: 400 });
  }

  try {
    const data = await getModuleAccessPanelData(moduleId, appId);
    return NextResponse.json(data);
  } catch (err) {
    console.error("module access panel", err);
    return NextResponse.json(
      { error: "Error al cargar acceso del módulo" },
      { status: 500 },
    );
  }
}
