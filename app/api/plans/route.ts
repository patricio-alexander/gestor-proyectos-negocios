import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { Period } from "../../../prisma/generated/prisma/enums";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const plans = await prisma.plan.findMany({
      where: { deleted_at: null },
      include: {
        business: { select: { name: true } },
        prices: { select: { id: true, price: true, period: true } },
        modules: {
          select: { id: true, module_id: true, module: { select: { name: true } } },
          where: { module: { deleted_at: null } },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const result = plans.map((p) => ({
      ...p,
      business_name: p.business.name,
      modules: p.modules.map((m) => ({
        id: m.id,
        module_id: m.module_id,
        module_name: m.module.name,
      })),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener planes" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    if (!business_id) {
      return NextResponse.json(
        { error: "Debe seleccionar un negocio" },
        { status: 400 }
      );
    }

    const business = await prisma.business.findFirst({
      where: { id: business_id, deleted_at: null },
    });

    if (!business) {
      return NextResponse.json(
        { error: "El negocio seleccionado no existe" },
        { status: 404 }
      );
    }

    const pricesData: { price: number; period: Period }[] = [];
    if (price_monthly != null && price_monthly !== "") {
      pricesData.push({ price: Number(price_monthly), period: Period.MONTHLY });
    }
    if (price_annual != null && price_annual !== "") {
      pricesData.push({ price: Number(price_annual), period: Period.ANNUALLY });
    }

    const modulesData =
      module_ids?.map((id: number) => ({ module_id: id })) ?? [];

    const plan = await prisma.plan.create({
      data: {
        name: name.trim(),
        business_id,
        prices: {
          create: pricesData,
        },
        modules: {
          create: modulesData,
        },
      },
      include: {
        business: { select: { name: true } },
        prices: { select: { id: true, price: true, period: true } },
        modules: {
          select: { id: true, module_id: true, module: { select: { name: true } } },
          where: { module: { deleted_at: null } },
        },
      },
    });

    return NextResponse.json(
      {
        ...plan,
        business_name: plan.business.name,
        modules: plan.modules.map((m) => ({
          id: m.id,
          module_id: m.module_id,
          module_name: m.module.name,
        })),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error al crear plan" },
      { status: 500 }
    );
  }
}
