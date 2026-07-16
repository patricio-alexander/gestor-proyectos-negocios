import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { requireAppId } from "@/src/shared/lib/app-kind";
import { Period } from "../../../../prisma/generated/prisma/enums";
import { findPlanById, mapPlanById } from "@/src/features/plans/lib/plan-query";
import {
  replacePlanAppModulesForApp,
  syncPlanAppModules,
} from "@/src/features/plans/lib/plan-app-modules";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const mapped = await mapPlanById(Number(id));

    if (!mapped) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(mapped);
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
    const {
      name,
      app_ids,
      price_monthly,
      price_annual,
      module_ids,
      offer_ids,
    } = await request.json();

    const existing = await findPlanById(planId);

    if (!existing) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 },
      );
    }

    if (app_ids) {
      for (const appId of app_ids) {
        const appCheck = await requireAppId(Number(appId));
        if (!appCheck.ok) {
          return NextResponse.json(
            { error: appCheck.error },
            { status: appCheck.status },
          );
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) {
        updateData.name = name.trim();
      }
      if (Object.keys(updateData).length > 0) {
        await tx.plan.update({
          where: { id: planId },
          data: updateData,
        });
      }

      if (module_ids !== undefined || app_ids !== undefined) {
        const selectedAppIds =
          app_ids !== undefined && Array.isArray(app_ids) && app_ids.length > 0
            ? app_ids
                .map((app_id: number) => Number(app_id))
                .filter((id) => !Number.isNaN(id))
            : [
                ...new Set(
                  existing.plan_app_modules.map((pam) => pam.app_module.app_id),
                ),
              ];

        const selectedModuleIds =
          module_ids !== undefined && Array.isArray(module_ids)
            ? module_ids
                .map((id: unknown) => Number(id))
                .filter((id) => !Number.isNaN(id))
            : [
                ...new Set(
                  existing.plan_app_modules.map(
                    (pam) => pam.app_module.module_id,
                  ),
                ),
              ];

        if (selectedAppIds.length === 1 && module_ids !== undefined) {
          await replacePlanAppModulesForApp(
            tx,
            planId,
            selectedAppIds[0],
            selectedModuleIds,
          );
        } else {
          await syncPlanAppModules(
            tx,
            planId,
            selectedAppIds,
            selectedModuleIds,
          );
        }
      }

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
              data: {
                plan_id: planId,
                price: Number(price_monthly),
                period: Period.MONTHLY,
              },
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
              data: {
                plan_id: planId,
                price: Number(price_annual),
                period: Period.ANNUALLY,
              },
            });
          }
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
    });

    const mapped = await mapPlanById(planId);
    const appIds = mapped?.app_ids.length ? mapped.app_ids : (app_ids ?? []);
    if (appIds.length > 0 && module_ids !== undefined) {
      const apps = await prisma.apps.findMany({
        where: { id: { in: appIds }, deleted_at: null },
        select: { hash: true },
      });
      const { pushEntitlementToApp } =
        await import("@/src/shared/lib/push-entitlement");
      for (const app of apps) {
        await pushEntitlementToApp(app.hash);
      }
    }

    return NextResponse.json(mapped);
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
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 },
      );
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
