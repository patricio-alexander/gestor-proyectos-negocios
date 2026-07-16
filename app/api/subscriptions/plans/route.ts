import { validateKey } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = await validateKey(request);
  if (apiKey.error) return apiKey.error;

  try {
    const catalogAppId = apiKey.app_id;

    const plans = await prisma.plan.findMany({
      select: {
        name: true,
        prices: {
          select: {
            price: true,
            period: true,
          },
        },

        plan_app_modules: {
          select: {
            app_module: {
              select: {
                module: {
                  select: {
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
      where: {
        plan_app_modules: {
          some: { app_module: { app_id: catalogAppId } },
        },
        deleted_at: null,
      },
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    });

    const mapPlans = plans.map((p) => ({
      name: p.name,
      prices: p.prices,
      modules: p.plan_app_modules.map((pam) => ({
        name: pam.app_module.module.name,
        description: pam.app_module.module.description,
      })),
    }));

    return NextResponse.json({ plans: mapPlans });
  } catch {
    return NextResponse.json({
      error: "Error al encontrar los planes",
      status: 500,
    });
  }
}
