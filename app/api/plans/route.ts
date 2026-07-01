import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { Period } from "../../../prisma/generated/prisma/enums";
import { mapPlan, planInclude } from "@/src/features/plans/lib/plan-query";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const plans = await prisma.plan.findMany({
      where: { deleted_at: null },
      include: planInclude,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(plans.map(mapPlan));
  } catch {
    return NextResponse.json(
      { error: "Error al obtener planes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { name, business_id, price_monthly, price_annual, module_ids } =
      await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre del plan es obligatorio" },
        { status: 400 },
      );
    }

    if (!business_id) {
      return NextResponse.json(
        { error: "Debe seleccionar una aplicación" },
        { status: 400 },
      );
    }

    const apps = await prisma.apps.findFirst({
      where: { id: business_id, deleted_at: null },
    });

    if (!apps) {
      return NextResponse.json(
        { error: "La aplicación seleccionada no existe" },
        { status: 404 },
      );
    }

    const pricesData: { price: number; period: Period }[] = [];
    if (price_monthly != null && price_monthly !== "") {
      pricesData.push({ price: Number(price_monthly), period: Period.MONTHLY });
    }
    if (price_annual != null && price_annual !== "") {
      pricesData.push({ price: Number(price_annual), period: Period.ANNUALLY });
    }

    const plan = await prisma.plan.create({
      data: {
        name: name.trim(),
        business_id,
        prices: { create: pricesData },
        plan_modules: module_ids?.length
          ? { create: module_ids.map((module_id: number) => ({ module_id })) }
          : undefined,
      },
      include: planInclude,
    });

    return NextResponse.json(mapPlan(plan), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear plan" },
      { status: 500 },
    );
  }
}
