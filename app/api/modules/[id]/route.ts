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
      include: {
        apps: { select: { name: true } },
        sections: { where: { deleted_at: null }, orderBy: { created_at: "asc" } },
      },
    });

    if (!mod) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ...mod, business_name: mod.apps.name });
  } catch {
    return NextResponse.json({ error: "Error al obtener el módulo" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const updates: Record<string, unknown> = await request.json();

    const existing = await prisma.module.findFirst({
      where: { id: Number(id), deleted_at: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    }

    const mod = await prisma.module.update({
      where: { id: Number(id) },
      data: {
        ...(updates.name !== undefined && {
          name: String(updates.name).trim(),
          key: String(updates.name)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, ""),
        }),
        ...(updates.description !== undefined && {
          description: updates.description ? String(updates.description).trim() : null,
        }),
        ...(updates.is_active !== undefined && {
          is_active: Boolean(updates.is_active),
        }),
      },
      include: {
        apps: { select: { name: true } },
        sections: { where: { deleted_at: null }, orderBy: { created_at: "asc" } },
      },
    });

    return NextResponse.json({ ...mod, business_name: mod.apps.name });
  } catch {
    return NextResponse.json({ error: "Error al actualizar el módulo" }, { status: 500 });
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
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    }

    await prisma.module.update({
      where: { id: Number(id) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar el módulo" }, { status: 500 });
  }
}
