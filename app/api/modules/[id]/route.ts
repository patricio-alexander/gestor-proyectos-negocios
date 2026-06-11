import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const mod = await prisma.module.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!mod) {
      return NextResponse.json(
        { error: "Módulo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(mod);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener el módulo" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { name, key } = await request.json();

    const existing = await prisma.module.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Módulo no encontrado" },
        { status: 404 }
      );
    }

    const mod = await prisma.module.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(key !== undefined && { key: key.trim() }),
      },
    });

    return NextResponse.json(mod);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar el módulo" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const existing = await prisma.module.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Módulo no encontrado" },
        { status: 404 }
      );
    }

    await prisma.module.update({
      where: { id: Number(id) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar el módulo" },
      { status: 500 }
    );
  }
}
