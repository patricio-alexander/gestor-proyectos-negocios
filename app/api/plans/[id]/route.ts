import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { Period } from "../../../../prisma/generated/prisma/enums";
import {
  findPlanById,
  mapPlan,
  planInclude,
} from "@/src/features/plans/lib/plan-query";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const plan = await findPlanById(Number(id));

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    return NextResponse.json(mapPlan(plan));
  } catch {
    return NextResponse.json(
      { error: "Error al obtener el plan" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const planId = Number(id);
    const { name, app_id, price_monthly, price_annual, module_ids, offer_ids } =
      await request.json();

    const existing = await findPlanById(planId);

    if (!existing) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    if (app_id) {
      const apps = await prisma.apps.findFirst({
        where: { id: app_id, deleted_at: null },
      });
      if (!apps) {
        return NextResponse.json(
          { error: "La aplicación seleccionada no existe" },
          { status: 404 },
        );
      }
    }

    const plan = await prisma.$transaction(async (tx) => {
      await tx.plan.update({
        where: { id: planId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(app_id !== undefined && { app_id }),
        },
      });

      if (price_monthly !== undefined || price_annual !== undefined) {
        if (price_monthly != null && price_monthly !== "") {
          const monthly = await tx.planPrice.findFirst({
            where: { plan_id: planId, period: Period.MONTHLY },
          });
          if (monthly) {
            await tx.planPrice.update({
              where: { id: monthly.id },
              data: { price: Number(price_monthly) },
            });
          } else {
            await tx.planPrice.create({
              data: { plan_id: planId, price: Number(price_monthly), period: Period.MONTHLY },
            });
          }
        }
        if (price_annual != null && price_annual !== "") {
          const annual = await tx.planPrice.findFirst({
            where: { plan_id: planId, period: Period.ANNUALLY },
          });
          if (annual) {
            await tx.planPrice.update({
              where: { id: annual.id },
              data: { price: Number(price_annual) },
            });
          } else {
            await tx.planPrice.create({
              data: { plan_id: planId, price: Number(price_annual), period: Period.ANNUALLY },
            });
          }
        }
      }

      if (module_ids !== undefined) {
        await tx.planModule.deleteMany({ where: { plan_id: planId } });
        if (module_ids.length > 0) {
          await tx.planModule.createMany({
            data: module_ids.map((module_id: number) => ({
              module_id,
              plan_id: planId,
            })),
          });
        }
      }

      if (offer_ids !== undefined) {
        await tx.planOffer.deleteMany({ where: { plan_id: planId } });
        if (offer_ids.length > 0) {
          await tx.planOffer.createMany({
            data: offer_ids.map((offer_id: number) => ({
              offer_id,
              plan_id: planId,
            })),
          });
        }
      }

      return tx.plan.findUnique({
        where: { id: planId },
        include: planInclude,
      });
    });

    return NextResponse.json(mapPlan(plan!));
  } catch (err) {
    console.error("Error al actualizar plan:", err);
    return NextResponse.json(
      { error: "Error al actualizar el plan" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const existing = await findPlanById(Number(id));

    if (!existing) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    await prisma.plan.update({
      where: { id: Number(id) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar el plan" },
      { status: 500 },
    );
  }
}
