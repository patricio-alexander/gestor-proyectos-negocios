import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { requireAppId } from "@/src/shared/lib/app-kind";
import { Period } from "../../../prisma/generated/prisma/enums";
import {
  mapPlan,
  mapPlansWithUsage,
  planInclude,
} from "@/src/features/plans/lib/plan-query";
import { syncPlanAppModules } from "@/src/features/plans/lib/plan-app-modules";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const plans = await prisma.plan.findMany({
      where: {
        deleted_at: null,
      },
      include: planInclude,
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    });

    return NextResponse.json(await mapPlansWithUsage(plans));
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
    const {
      name,
      app_ids,
      price_monthly,
      price_annual,
      module_ids,
      offer_ids,
    } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre del plan es obligatorio" },
        { status: 400 },
      );
    }

    const appIds = Array.isArray(app_ids)
      ? app_ids
          .map((id: unknown) => Number(id))
          .filter((id) => !Number.isNaN(id))
      : [];

    for (const appId of appIds) {
      const appCheck = await requireAppId(appId);
      if (!appCheck.ok) {
        return NextResponse.json(
          { error: appCheck.error },
          { status: appCheck.status },
        );
      }
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
        prices: { create: pricesData },
        planOffers: offer_ids?.length
          ? { create: offer_ids.map((offer_id: number) => ({ offer_id })) }
          : undefined,
      },
      include: planInclude,
    });

    if (module_ids?.length && appIds.length) {
      await syncPlanAppModules(prisma, plan.id, appIds, module_ids as number[]);
    }

    const created = await prisma.plan.findFirst({
      where: { id: plan.id },
      include: planInclude,
    });

    return NextResponse.json(mapPlan(created!), { status: 201 });
  } catch (err) {
    console.error("Error al crear plan:", err);
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 });
  }
}
