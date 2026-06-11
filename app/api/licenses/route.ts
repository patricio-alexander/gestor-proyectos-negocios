import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { Period, LicenseStatus } from "../../../prisma/generated/prisma/enums";
import crypto from "crypto";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { plan_id, period }: { plan_id: number; period: Period } =
      await request.json();

    if (!plan_id || !period) {
      return NextResponse.json(
        { error: "plan_id y period son obligatorios" },
        { status: 400 }
      );
    }

    if (![Period.MONTHLY, Period.ANNUALLY].includes(period)) {
      return NextResponse.json(
        { error: "Periodo inválido. Use MONTHLY o ANNUALLY" },
        { status: 400 }
      );
    }

    const planPrice = await prisma.planPrice.findFirst({
      where: { plan_id, period, plan: { deleted_at: null } },
    });

    if (!planPrice) {
      return NextResponse.json(
        { error: "No se encontró un precio para el plan y periodo seleccionado" },
        { status: 404 }
      );
    }

    const key = crypto.randomUUID();

    const license = await prisma.license.create({
      data: {
        plan_price_id: planPrice.id,
        key,
        status: LicenseStatus.AVAILABLE,
      },
    });

    return NextResponse.json(
      {
        id: license.id,
        plan_price_id: license.plan_price_id,
        period,
        key: license.key,
        status: license.status,
        used_at: license.used_at?.toISOString() ?? null,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error al crear licencia" },
      { status: 500 }
    );
  }
}
