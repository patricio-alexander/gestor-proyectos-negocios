import { validateApiKey } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, response: NextResponse) {
  // const apiKey = await validateApiKey(request);
  // if (apiKey.error) return apiKey.error;

  try {
    const plans = await prisma.plan.findMany({
      select: {
        name: true,
        prices: {
          select: {
            price: true,
            period: true,
          },
        },

        plan_modules: {
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
      where: { app_id: 1 },
    });

    if (!plans) {
      return NextResponse.json(
        { error: "Aplicación no encontrada" },
        { status: 404 },
      );
    }

    const mapPlans = plans.map((p) => ({
      name: p.name,
      prices: p.prices,
      modules: p.plan_modules.map((pm) => ({
        name: pm.module.name,
        desription: pm.module.description,
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
