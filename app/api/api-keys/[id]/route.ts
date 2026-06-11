import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { active } = await request.json();

    if (active === undefined) {
      return NextResponse.json(
        { error: "El campo active es obligatorio" },
        { status: 400 },
      );
    }

    const existing = await prisma.apiKey.findFirst({
      where: { id: Number(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "API key no encontrada" },
        { status: 404 },
      );
    }

    if (active) {
      await prisma.apiKey.updateMany({
        where: { business_id: existing.business_id, active: true },
        data: { active: false },
      });
    }

    const updated = await prisma.apiKey.update({
      where: { id: Number(id) },
      data: { active },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      prefix: updated.prefix,
      active: updated.active,
      business_id: updated.business_id,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar API key" },
      { status: 500 },
    );
  }
}
