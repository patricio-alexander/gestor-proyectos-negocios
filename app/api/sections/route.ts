import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { parseMaxRecordsLimit } from "@/src/shared/utils/max-records-limit";

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const module_id = searchParams.get("module_id");

    const where: Record<string, unknown> = { deleted_at: null };
    if (module_id) {
      where.module_id = Number(module_id);
    }

    const sections = await prisma.section.findMany({
      where,
      orderBy: { created_at: "asc" },
    });
    return NextResponse.json(sections);
  } catch {
    return NextResponse.json({ error: "Error al obtener secciones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { name, module_id, max_records_limit } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "El nombre de la sección es obligatorio" }, { status: 400 });
    }
    if (!module_id) {
      return NextResponse.json({ error: "El módulo es obligatorio" }, { status: 400 });
    }

    const limitResult = parseMaxRecordsLimit(max_records_limit);
    if (!limitResult.ok) {
      return NextResponse.json({ error: limitResult.error }, { status: 400 });
    }

    const mod = await prisma.module.findFirst({
      where: { id: Number(module_id), deleted_at: null },
    });
    if (!mod) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    }

    const section = await prisma.section.create({
      data: {
        name: name.trim(),
        module_id: Number(module_id),
        max_records_limit: limitResult.value,
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear sección" }, { status: 500 });
  }
}
