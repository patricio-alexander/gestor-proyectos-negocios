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
                    app_module: {
                      select: {
                        name: true,
                        key: true,
                        sections: {
                          where: { deleted_at: null, is_active: true },
                          select: { name: true, key: true, route_path: true },
                          orderBy: { sort_order: "asc" },
                        },
                      },
                    },
                  },
                  where: { app_module: { deleted_at: null, is_active: true } },
                },
                sections: {
                  select: {
                    app_section: {
                      select: {
                        name: true,
                        key: true,
                        route_path: true,
                        app_module: { select: { name: true, key: true } },
                      },
                    },
                  },
                  where: { app_section: { deleted_at: null, is_active: true } },
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

    const modulesFromPlan = plan.modules.map((pm) => ({
      name: pm.app_module.name,
      key: pm.app_module.key,
      sections: pm.app_module.sections,
    }));

    const moduleKeys = new Set(modulesFromPlan.map((m) => m.key));
    const extraByModule = new Map<
      string,
      { name: string; key: string; sections: { name: string; key: string; route_path: string | null }[] }
    >();

    for (const ps of plan.sections) {
      const modKey = ps.app_section.app_module.key;
      if (moduleKeys.has(modKey)) continue;

      const existing = extraByModule.get(modKey) ?? {
        name: ps.app_section.app_module.name,
        key: modKey,
        sections: [],
      };
      existing.sections.push({
        name: ps.app_section.name,
        key: ps.app_section.key,
        route_path: ps.app_section.route_path,
      });
      extraByModule.set(modKey, existing);
    }

    const modules = [...modulesFromPlan, ...extraByModule.values()];

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
