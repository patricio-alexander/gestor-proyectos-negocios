import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { SubscriptionStatus } from "../../../../../prisma/generated/prisma/enums";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: Params) {
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
        { status: 404 }
      );
    }

    if (sub.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Solo se pueden cancelar suscripciones activas" },
        { status: 400 }
      );
    }

    const updated = await prisma.subscription.update({
      where: { id: Number(id) },
      data: { status: SubscriptionStatus.CANCELED },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al cancelar suscripción" },
      { status: 500 }
    );
  }
}
