import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { validateApiKey } from "@/src/shared/lib/api-auth";

export async function GET(request: NextRequest) {
  const apiKey = await validateApiKey(request);
  if (apiKey.error) return apiKey.error;

  try {
    const business = await prisma.business.findFirst({
      where: { hash: apiKey.business_hash, deleted_at: null },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 },
      );
    }

    const subscription = await prisma.subscription.findFirst({
      where: { business_hash: apiKey.business_hash },
      include: {
        plan_price: {
          include: {
            plan: {
              select: {
                name: true,
                modules: {
                  select: {
                    module: {
                      select: {
                        name: true,
                        key: true,
                        sections: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                  where: { module: { deleted_at: null } },
                },
              },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    if (!subscription) {
      return NextResponse.json({
        subscribed: false,
        subscription: null,
      });
    }

    const modules = subscription.plan_price.plan.modules
      .map((pm) => ({
        name: pm.module.name,
        key: pm.module.key,
        sections: pm.module.sections,
      }))
      .filter((m) => m.sections.length);

    return NextResponse.json({
      subscribed: subscription.status === "ACTIVE",
      subscription: {
        id: subscription.id,
        plan_name: subscription.plan_price.plan.name,
        period: subscription.plan_price.period,
        status: subscription.status,
        start_at: subscription.start_at?.toISOString() ?? null,
        expires_at: subscription.expires_at?.toISOString() ?? null,
        modules,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Error al verificar suscripción" },
      { status: 500 },
    );
  }
}
