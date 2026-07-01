import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { validateApiKey } from "@/src/shared/lib/api-auth";

export async function GET(request: NextRequest) {
  const apiKey = await validateApiKey(request);
  if (apiKey.error) return apiKey.error;

  try {
    const business = await prisma.apps.findFirst({
      where: { hash: apiKey.business_hash, deleted_at: null },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Aplicación no encontrada" },
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
                plan_modules: {
                  select: {
                    module: {
                      select: {
                        id: true,
                        name: true,
                        sections: {
                          select: {
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
      orderBy: { id: "desc" },
    });

    if (!subscription) {
      return NextResponse.json({
        subscribed: false,
        subscription: null,
      });
    }

    const plan = subscription.plan_price.plan;

    const modules = plan.plan_modules.map((pm) => ({
      id: pm.module.id,
      name: pm.module.name,
      sections: pm.module.sections.map((s) => s.name),
    }));

    return NextResponse.json({
      subscribed: subscription.status === "ACTIVE",
      subscription: {
        id: subscription.id,
        plan_name: plan.name,
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
