import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { validateApiKey } from "@/src/shared/lib/api-auth";

export async function GET(request: NextRequest) {
  const apiKey = await validateApiKey(request);
  if (apiKey.error) return apiKey.error;

  try {
    const business = await prisma.apps.findFirst({
      where: { hash: apiKey.app_hash, deleted_at: null },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Aplicación no encontrada" },
        { status: 404 },
      );
    }

    const subscription = await prisma.subscription.findFirst({
      where: { app_hash: apiKey.app_hash },
      include: {
        plan_price: {
          include: {
            plan: {
              select: {
                name: true,
                plan_modules: {
                  select: {
                    module: {
                      select: {
                        id: true,
                        name: true,
                        sections: {
                          where: { deleted_at: null },
                          select: {
                            id: true,
                            key: true,
                            name: true,
                            max_records_limit: true,
                            capabilities: {
                              select: {
                                id: true,
                                code: true,
                                name: true,
                                is_active: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                planOffers: {
                  select: {
                    offer: {
                      select: {
                        name: true,
                        price: true,
                        start_at: true,
                        expires_at: true,
                        offersModules: {
                          select: {
                            modules: {
                              select: {
                                id: true,
                                name: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    const app = await prisma.apps.findFirst({
      where: { hash: apiKey.app_hash },
      select: { maintenance: true },
    });

    if (!subscription || !app) {
      return NextResponse.json({
        subscribed: false,
        subscription: null,
      });
    }

    const plan = subscription.plan_price.plan;

    const modules = plan.plan_modules.map((pm) => ({
      id: pm.module.id,
      name: pm.module.name,
      sections: pm.module.sections.map((s) => ({
        id: s.id,
        key: s.key,
        name: s.name,
        max_records_limit: s.max_records_limit,
      })),
    }));

    const capabilities = plan.plan_modules.flatMap((pm) =>
      pm.module.sections.flatMap((s) => {
        const availableCapabilities = s.capabilities.map((c) => [
          c.code,
          c.is_active,
        ]);
        return Object.fromEntries(availableCapabilities);
      }),
    );

    const offers = (plan.planOffers ?? []).map((po) => ({
      name: po.offer.name,
      price: po.offer.price ?? null,
      start_at: po.offer.start_at.toISOString(),
      expires_at: po.offer.expires_at.toISOString(),
      modules: (po.offer.offersModules ?? []).map((om) => ({
        id: om.modules.id,
        name: om.modules.name,
      })),
    }));

    return NextResponse.json({
      maintenance: app.maintenance,
      subscribed: subscription.status === "ACTIVE",
      subscription: {
        id: subscription.id,
        plan_name: plan.name,
        period: subscription.plan_price.period,
        status: subscription.status,
        start_at: subscription.start_at?.toISOString() ?? null,
        expires_at: subscription.expires_at?.toISOString() ?? null,
        modules,
        capabilities,
        offers,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Error al verificar suscripción" },
      { status: 500 },
    );
  }
}
