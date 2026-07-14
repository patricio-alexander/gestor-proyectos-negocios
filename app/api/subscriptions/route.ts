import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { Period, SubscriptionStatus } from "../../../prisma/generated/prisma/enums";
import { pushEntitlementToApp } from "@/src/shared/lib/push-entitlement";
export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        apps: { select: { name: true } },
        plan_price: {
          include: { plan: { select: { id: true, name: true } } },
        },
      },
      orderBy: { id: "desc" },
    });

    const result = subscriptions.map((s) => ({
      id: s.id,
      app_hash: s.app_hash,
      app_name: s.apps.name,
      plan_id: s.plan_price.plan.id,
      plan_price_id: s.plan_price_id,
      plan_name: s.plan_price.plan.name,
      period: s.plan_price.period,
      price: s.plan_price.price,
      start_at: s.start_at?.toISOString() ?? null,
      expires_at: s.expires_at?.toISOString() ?? null,
      status: s.status,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener suscripciones" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { app_hash, plan_price_id, start_at, expires_at, status } = body;

    if (!app_hash || !plan_price_id) {
      return NextResponse.json(
        { error: "app_hash y plan_price_id son obligatorios" },
        { status: 400 },
      );
    }

    const app = await prisma.apps.findFirst({
      where: { hash: app_hash, deleted_at: null },
      select: { id: true },
    });
    if (!app) {
      return NextResponse.json(
        { error: "Aplicación no encontrada" },
        { status: 404 },
      );
    }

    const planPrice = await prisma.planPrice.findFirst({
      where: { id: Number(plan_price_id), plan: { deleted_at: null } },
    });
    if (!planPrice) {
      return NextResponse.json(
        { error: "Precio de plan no encontrado" },
        { status: 404 },
      );
    }

    const now = start_at ? new Date(String(start_at)) : new Date();
    let expiresAt: Date | null = null;
    if (expires_at) {
      expiresAt = new Date(String(expires_at));
    } else {
      expiresAt = new Date(now);
      if (planPrice.period === Period.MONTHLY) {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }
    }

    const subscription = await prisma.subscription.create({
      data: {
        app_hash,
        plan_price_id: Number(plan_price_id),
        start_at: now,
        expires_at: expiresAt,
        status: status || SubscriptionStatus.ACTIVE,
      },
    });

    await pushEntitlementToApp(subscription.app_hash);

    return NextResponse.json(
      {
        id: subscription.id,
        app_hash: subscription.app_hash,
        plan_price_id: subscription.plan_price_id,
        start_at: subscription.start_at?.toISOString() ?? null,
        expires_at: subscription.expires_at?.toISOString() ?? null,
        status: subscription.status,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Error al crear suscripción" },
      { status: 500 },
    );
  }
}
