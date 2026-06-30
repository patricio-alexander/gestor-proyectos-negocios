import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import type { CreateUserInput } from "@/src/features/users/types";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;
  try {
    const users = await prisma.user.findMany({
      where: { deleted_at: null, NOT: { id: auth.user.userId } },
      orderBy: { created_at: "desc" },
      select: { id: true, username: true, email: true, created_at: true, updated_at: true, deleted_at: true },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { username, email, password }: CreateUserInput = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: "El nombre de usuario es obligatorio" },
        { status: 400 },
      );
    }

    if (!password || !password.trim()) {
      return NextResponse.json(
        { error: "La contraseña es obligatoria" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findFirst({
      where: { username: username.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "El nombre de usuario ya está en uso" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email?.trim() || null,
        password: hashedPassword,
      },
      select: { id: true, username: true, email: true, created_at: true, updated_at: true, deleted_at: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 },
    );
  }
}
