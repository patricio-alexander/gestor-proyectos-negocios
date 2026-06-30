import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import type { UpdateUserInput } from "@/src/features/users/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;
  try {
    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, username: true, email: true, created_at: true, updated_at: true, deleted_at: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener el usuario" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const updates: UpdateUserInput = await request.json();

    const existing = await prisma.user.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    if (updates.username !== undefined) {
      const duplicate = await prisma.user.findFirst({
        where: {
          username: updates.username.trim(),
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "El nombre de usuario ya está en uso" },
          { status: 409 },
        );
      }
    }

    const data: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (updates.username !== undefined) {
      data.username = updates.username.trim() || null;
    }
    if (updates.email !== undefined) {
      data.email = updates.email.trim() || null;
    }
    if (updates.password !== undefined && updates.password.trim()) {
      data.password = await bcrypt.hash(updates.password.trim(), 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true, created_at: true, updated_at: true, deleted_at: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar el usuario" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const existing = await prisma.user.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    await prisma.user.update({
      where: { id },
      data: { deleted_at: new Date(), updated_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar el usuario" },
      { status: 500 },
    );
  }
}
