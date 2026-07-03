import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const sub = await prisma.subscription.findFirst({
      where: { id: Number(id) },
    });

    if (!sub) {
      return NextResponse.json(
        { error: "Suscripción no encontrada" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const data: Record<string, Date> = {};

    if (body.start_at !== undefined) {
      data.start_at = new Date(body.start_at);
    }
    if (body.expires_at !== undefined) {
      data.expires_at = new Date(body.expires_at);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 },
      );
    }

    const updated = await prisma.subscription.update({
      where: { id: Number(id) },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      start_at: updated.start_at?.toISOString() ?? null,
      expires_at: updated.expires_at?.toISOString() ?? null,
      status: updated.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar suscripción" },
      { status: 500 },
    );
  }
}
