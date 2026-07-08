import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(_request: Request, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await prisma.section.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
    }

    const max_records_limit = existing.max_records_limit ?? 0;
    const usage = existing.usage_count;
    const remaining = max_records_limit > 0 ? Math.max(0, max_records_limit - usage) : 0;

    if (max_records_limit > 0 && usage >= max_records_limit) {
      return NextResponse.json(
        { error: "Límite de uso alcanzado", max_records_limit, usage, remaining },
        { status: 403 },
      );
    }

    const section = await prisma.section.update({
      where: { id: Number(id) },
      data: { usage_count: { increment: 1 } },
    });

    return NextResponse.json({
      max_records_limit,
      usage: section.usage_count,
      remaining: max_records_limit > 0 ? Math.max(0, max_records_limit - section.usage_count) : 0,
    });
  } catch {
    return NextResponse.json({ error: "Error al actualizar el uso" }, { status: 500 });
  }
}