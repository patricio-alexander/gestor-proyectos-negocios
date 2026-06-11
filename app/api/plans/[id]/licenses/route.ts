import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const planPrices = await prisma.planPrice.findMany({
      where: { plan_id: Number(id), plan: { deleted_at: null } },
      include: {
        licenses: {
          include: { plan_price: { select: { period: true } } },
          orderBy: { id: "desc" },
        },
      },
    });

    const licenses = planPrices.flatMap((pp) =>
      pp.licenses.map((l) => ({
        id: l.id,
        plan_price_id: l.plan_price_id,
        period: pp.period,
        key: l.key,
        status: l.status,
        used_at: l.used_at?.toISOString() ?? null,
        method_pay: l.method_pay,
      }))
    );

    return NextResponse.json(licenses);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener licencias" },
      { status: 500 }
    );
  }
}
