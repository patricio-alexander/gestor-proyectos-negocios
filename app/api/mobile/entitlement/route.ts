import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { buildEntitlementForAppHash } from "@/src/shared/lib/entitlement-payload";
import { validateMobileApiKey } from "@/src/features/mobile-apps/lib/mobile-api-auth";

/**
 * Entitlement + catálogo de planes para apps móviles.
 * Auth: Authorization: Bearer {mobile_app.api_key}
 *
 * Solo módulos/planes channel=mobile (no mezcla con SoftEd/web).
 */
export async function GET(request: NextRequest) {
  const auth = await validateMobileApiKey(request);
  if (auth.error) return auth.error;

  if (!auth.control_app_hash) {
    return NextResponse.json(
      {
        error:
          "La app móvil no tiene app de control vinculada. Revisa Apps móvil en el gestor.",
      },
      { status: 503 },
    );
  }

  const payload = await buildEntitlementForAppHash(auth.control_app_hash);

  const plans = await prisma.plan.findMany({
    where: { deleted_at: null, channel: "mobile" },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      sort_order: true,
      channel: true,
      prices: {
        select: { id: true, price: true, period: true },
      },
      plan_app_modules: {
        where: {
          app_module: {
            app_id: auth.control_app_id ?? undefined,
            module: { deleted_at: null, channel: "mobile" },
          },
        },
        select: {
          app_module: {
            select: {
              module: {
                select: { id: true, key: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  const catalogPlans = plans.map((p) => ({
    id: p.id,
    name: p.name,
    sort_order: p.sort_order,
    channel: p.channel,
    prices: p.prices,
    modules: p.plan_app_modules.map((pam) => ({
      id: pam.app_module.module.id,
      key: pam.app_module.module.key,
      name: pam.app_module.module.name,
    })),
  }));

  return NextResponse.json({
    app_key: auth.app_key,
    channel: "mobile",
    maintenance: payload.maintenance,
    subscribed: payload.subscribed,
    subscription: payload.subscription,
    modules: payload.subscription?.modules ?? [],
    plans: catalogPlans,
  });
}
