import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

function normalizeCode(code: string): string {
  return code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const section_id = searchParams.get("section_id");

    const where: Record<string, unknown> = {};
    if (section_id) {
      where.section_id = Number(section_id);
    }

    const capabilities = await prisma.capability.findMany({
      where,
      orderBy: { created_at: "asc" },
    });

    return NextResponse.json(capabilities);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener capabilities" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { section_id, code, name } = await request.json();

    if (!section_id) {
      return NextResponse.json(
        { error: "La sección es obligatoria" },
        { status: 400 },
      );
    }
    if (!code || !String(code).trim()) {
      return NextResponse.json(
        { error: "El código es obligatorio" },
        { status: 400 },
      );
    }
    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 },
      );
    }

    const section = await prisma.section.findFirst({
      where: { id: Number(section_id), deleted_at: null },
    });
    if (!section) {
      return NextResponse.json(
        { error: "Sección no encontrada" },
        { status: 404 },
      );
    }

    const capability = await prisma.capability.create({
      data: {
        section_id: Number(section_id),
        code: normalizeCode(String(code)),
        name: String(name).trim(),
      },
    });

    return NextResponse.json(capability, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear capability" },
      { status: 500 },
    );
  }
}
