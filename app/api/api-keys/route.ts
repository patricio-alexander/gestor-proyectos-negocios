import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import crypto from "crypto";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const keys = await prisma.apiKey.findMany({
      include: { apps: { select: { name: true } } },
      orderBy: { created_at: "desc" },
    });

    const result = keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      active: k.active,
      business_id: k.business_id,
      business_name: k.apps.name,
      created_at: k.created_at.toISOString(),
      updated_at: k.updated_at.toISOString(),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener API keys" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { name, business_id } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la API key es obligatorio" },
        { status: 400 }
      );
    }

    if (!business_id) {
      return NextResponse.json(
        { error: "Debe seleccionar una aplicación" },
        { status: 400 }
      );
    }

    const business = await prisma.apps.findFirst({
      where: { id: business_id, deleted_at: null },
    });

    if (!business) {
      return NextResponse.json(
        { error: "La aplicación seleccionada no existe" },
        { status: 404 }
      );
    }

    const rawKey = "gc_" + crypto.randomBytes(16).toString("hex");
    const prefix = rawKey.slice(0, 11);
    const hash = crypto.createHash("sha256").update(rawKey).digest("hex");

    await prisma.apiKey.updateMany({
      where: { business_id, active: true },
      data: { active: false },
    });

    const apiKey = await prisma.apiKey.create({
      data: { name: name.trim(), business_id, prefix, hash, active: true },
    });

    return NextResponse.json(
      {
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        key: rawKey,
        business_id: apiKey.business_id,
        active: apiKey.active,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error al crear API key" },
      { status: 500 }
    );
  }
}
