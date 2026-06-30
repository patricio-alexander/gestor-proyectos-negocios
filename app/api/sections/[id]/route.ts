import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la sección es obligatorio" },
        { status: 400 }
      );
    }

    const existing = await prisma.section.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Sección no encontrada" },
        { status: 404 }
      );
    }

    const section = await prisma.section.update({
      where: { id: Number(id) },
      data: { name: name.trim() },
    });

    return NextResponse.json(section);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar la sección" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const existing = await prisma.section.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Sección no encontrada" },
        { status: 404 }
      );
    }

    await prisma.section.update({
      where: { id: Number(id) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar la sección" },
      { status: 500 }
    );
  }
}
