import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { validateApiKey } from "@/src/shared/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const apiKey = await validateApiKey(request);

  if (apiKey.error) return apiKey.error;

  try {
    const { id } = await params;

    const mod = await prisma.module.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!mod) {
      return NextResponse.json(
        { error: "Módulo no encontrado" },
        { status: 404 },
      );
    }

    if (!mod.is_trial) {
      return NextResponse.json(
        { error: "El modo de prueba esta desactivado para este módulo" },
        { status: 400 },
      );
    }

    if (!mod.limit_days_trial) {
      return NextResponse.json(
        { error: "El módulo no tiene límite de días de prueba configurado" },
        { status: 400 },
      );
    }

    if (mod.end_trial) {
      return NextResponse.json(
        { error: "El módulo ya está en periodo de prueba" },
        { status: 400 },
      );
    }

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + mod.limit_days_trial);

    const updated = await prisma.module.update({
      where: { id: Number(id) },
      data: {
        is_trial: true,
        start_trial: now,
        end_trial: end,
      },
      include: {
        apps: { select: { name: true } },
      },
    });

    return NextResponse.json({
      is_started: true,
      start_trial: updated.start_trial,
      end_tria: updated.end_trial,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al iniciar el periodo de prueba" },
      { status: 500 },
    );
  }
}
