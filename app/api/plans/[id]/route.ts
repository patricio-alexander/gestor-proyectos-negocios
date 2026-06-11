import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { Period } from "../../../../prisma/generated/prisma/enums";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const plan = await prisma.plan.findFirst({
      where: { id: Number(id), deleted_at: null },
      include: {
        business: { select: { name: true } },
        prices: { select: { id: true, price: true, period: true } },
        modules: {
          select: { id: true, module_id: true, module: { select: { name: true } } },
          where: { module: { deleted_at: null } },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      ...plan,
      business_name: plan.business.name,
      modules: plan.modules.map((m) => ({
        id: m.id,
        module_id: m.module_id,
        module_name: m.module.name,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener el plan" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { name, business_id, price_monthly, price_annual, module_ids } =
      await request.json();

    const existing = await prisma.plan.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    if (business_id) {
      const business = await prisma.business.findFirst({
        where: { id: business_id, deleted_at: null },
      });
      if (!business) {
        return NextResponse.json(
          { error: "El negocio seleccionado no existe" },
          { status: 404 }
        );
      }
    }

    const plan = await prisma.$transaction(async (tx) => {
      const updated = await tx.plan.update({
        where: { id: Number(id) },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(business_id !== undefined && { business_id }),
        },
        include: {
          business: { select: { name: true } },
          prices: { select: { id: true, price: true, period: true } },
          modules: {
            select: { id: true, module_id: true, module: { select: { name: true } } },
          },
        },
      });

      if (price_monthly !== undefined || price_annual !== undefined) {
        if (price_monthly != null && price_monthly !== "") {
          const existing = await tx.planPrice.findFirst({ where: { plan_id: Number(id), period: Period.MONTHLY } });
          if (existing) {
            await tx.planPrice.update({ where: { id: existing.id }, data: { price: Number(price_monthly) } });
          } else {
            await tx.planPrice.create({ data: { plan_id: Number(id), price: Number(price_monthly), period: Period.MONTHLY } });
          }
        }
        if (price_annual != null && price_annual !== "") {
          const existing = await tx.planPrice.findFirst({ where: { plan_id: Number(id), period: Period.ANNUALLY } });
          if (existing) {
            await tx.planPrice.update({ where: { id: existing.id }, data: { price: Number(price_annual) } });
          } else {
            await tx.planPrice.create({ data: { plan_id: Number(id), price: Number(price_annual), period: Period.ANNUALLY } });
          }
        }
      }

      if (module_ids !== undefined) {
        await tx.planModule.deleteMany({ where: { plan_id: Number(id) } });

        const modulesData = module_ids.map((mid: number) => ({
          module_id: mid,
          plan_id: Number(id),
        }));

        if (modulesData.length > 0) {
          await tx.planModule.createMany({ data: modulesData });
        }
      }

      const finalPlan = await tx.plan.findUnique({
        where: { id: Number(id) },
        include: {
          business: { select: { name: true } },
          prices: { select: { id: true, price: true, period: true } },
          modules: {
            select: { id: true, module_id: true, module: { select: { name: true } } },
          },
        },
      });

      return finalPlan!;
    });

    return NextResponse.json({
      ...plan,
      business_name: plan.business.name,
      modules: plan.modules.map((m) => ({
        id: m.id,
        module_id: m.module_id,
        module_name: m.module.name,
      })),
    });
  } catch (err) {
    console.error("Error al actualizar plan:", err);
    return NextResponse.json(
      { error: "Error al actualizar el plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const existing = await prisma.plan.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

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
      { status: 500 }
    );
  }
}
