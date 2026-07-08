import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const updates: Record<string, unknown> = await request.json();

    const existing = await prisma.capability.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Capability no encontrada" },
        { status: 404 },
      );
    }

    const capability = await prisma.capability.update({
      where: { id: Number(id) },
      data: {
        ...(updates.name !== undefined && {
          name: String(updates.name).trim(),
        }),
        ...(updates.is_active !== undefined && {
          is_active: Boolean(updates.is_active),
        }),
      },
    });

    return NextResponse.json(capability);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar capability" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const existing = await prisma.capability.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Capability no encontrada" },
        { status: 404 },
      );
    }

    await prisma.capability.delete({ where: { id: Number(id) } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar capability" },
      { status: 500 },
    );
  }
}
