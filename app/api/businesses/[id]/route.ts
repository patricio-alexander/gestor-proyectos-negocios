import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import type { UpdateBusinessInput } from "@/src/features/businesses/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;
  try {
    const { id } = await params;

    const business = await prisma.business.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener el negocio" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const updates: UpdateBusinessInput = await request.json();

    const existing = await prisma.business.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const business = await prisma.business.update({
      where: { id: Number(id) },
      data: {
        ...(updates.name !== undefined && { name: updates.name.trim() }),
        ...(updates.owner_name !== undefined && {
          owner_name: updates.owner_name.trim() || null,
        }),
        ...(updates.phone !== undefined && {
          phone: updates.phone.trim() || null,
        }),
        ...(updates.ruc !== undefined && {
          ruc: updates.ruc.trim() || null,
        }),
        ...(updates.address !== undefined && {
          address: updates.address.trim() || null,
        }),
        ...(updates.email !== undefined && {
          email: updates.email.trim() || null,
        }),
      },
    });

    return NextResponse.json(business);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar el negocio" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const existing = await prisma.business.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    await prisma.business.update({
      where: { id: Number(id) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar el negocio" },
      { status: 500 }
    );
  }
}
