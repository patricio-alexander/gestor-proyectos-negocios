import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const modules = await prisma.module.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(modules);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener módulos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { name, key } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre del módulo es obligatorio" },
        { status: 400 }
      );
    }

    if (!key || !key.trim()) {
      return NextResponse.json(
        { error: "La clave del módulo es obligatoria" },
        { status: 400 }
      );
    }

    const moduleKey = key.trim();

    const mod = await prisma.module.create({
      data: { name: name.trim(), key: moduleKey },
    });

    return NextResponse.json(mod, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear módulo" },
      { status: 500 }
    );
  }
}
