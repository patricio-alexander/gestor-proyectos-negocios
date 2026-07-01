import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

function generateKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;
  try {
    const modules = await prisma.module.findMany({
      where: { deleted_at: null },
      include: {
        apps: { select: { name: true } },
        secciones: { where: { deleted_at: null }, orderBy: { created_at: "asc" } },
      },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(
      modules.map((m) => ({
        ...m,
        business_name: m.apps.name,
      }))
    );
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
    const body = await request.json();
    const name = body.name as string | undefined;
    const business_id = body.business_id as number | undefined;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "El nombre del módulo es obligatorio" }, { status: 400 });
    }
    if (!business_id) {
      return NextResponse.json({ error: "La aplicación es obligatoria" }, { status: 400 });
    }

    const key = generateKey(name.trim());

    const mod = await prisma.module.create({
      data: {
        name: name.trim(),
        key,
        business_id: Number(business_id),
      },
      include: {
        apps: { select: { name: true } },
        secciones: { where: { deleted_at: null }, orderBy: { created_at: "asc" } },
      },
    });

    return NextResponse.json({ ...mod, business_name: mod.apps.name }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear módulo" }, { status: 500 });
  }
}
