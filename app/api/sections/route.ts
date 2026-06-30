import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { name, module_id } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la sección es obligatorio" },
        { status: 400 }
      );
    }

    if (!module_id) {
      return NextResponse.json(
        { error: "El módulo es obligatorio" },
        { status: 400 }
      );
    }

    const section = await prisma.section.create({
      data: { name: name.trim(), module_id: Number(module_id) },
    });

    return NextResponse.json(section, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear sección" },
      { status: 500 }
    );
  }
}
