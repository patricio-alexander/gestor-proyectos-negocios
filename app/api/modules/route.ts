import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const modules = await prisma.module.findMany({
      where: { deleted_at: null },
      include: {
        business: { select: { name: true } },
        sections: { where: { deleted_at: null } },
      },
      orderBy: { created_at: "desc" },
    });

    const result = modules.map((m) => ({
      ...m,
      business_name: m.business.name ?? null,
      business: undefined,
    }));

    return NextResponse.json(result);
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
    const { name, key, business_id } = await request.json();

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

    if (!business_id) {
      return NextResponse.json(
        { error: "El negocio es obligatorio" },
        { status: 400 }
      );
    }

    const moduleKey = key.trim();

    const mod = await prisma.module.create({
      data: { name: name.trim(), key: moduleKey, business_id: Number(business_id) },
      include: {
        business: { select: { name: true } },
        sections: { where: { deleted_at: null } },
      },
    });

    const result = {
      ...mod,
      business_name: mod.business.name ?? null,
      business: undefined,
    };

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear módulo" },
      { status: 500 }
    );
  }
}
