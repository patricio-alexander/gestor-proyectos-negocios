import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import {
  Period,
  SubscriptionStatus,
} from "../../../../prisma/generated/prisma/enums";
import { pushEntitlementToApp } from "@/src/shared/lib/push-entitlement";
import { requireDeploymentAppId } from "@/src/shared/lib/app-kind";

/**
 * Habilita una suscripción desde el gestor para una app concreta.
 * Body: {
 *   plan_id, app_id,
 *   period: MONTHLY|ANNUALLY,
 *   replace?: boolean  // si la app ya tiene sub ACTIVE, reemplazar
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const planId = Number(body.plan_id);
    const appId = Number(body.app_id);
    const replace = Boolean(body.replace);
    const period =
      body.period === Period.ANNUALLY ? Period.ANNUALLY : Period.MONTHLY;

    if (!planId) {
      return NextResponse.json(
        { error: "plan_id es obligatorio" },
        { status: 400 },
      );
    }
    if (!appId) {
      return NextResponse.json(
        { error: "Elegí a qué app habilitar el plan" },
        { status: 400 },
      );
    }

    const plan = await prisma.plan.findFirst({
      where: { id: planId, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const deploymentCheck = await requireDeploymentAppId(appId);
    if (!deploymentCheck.ok) {
      return NextResponse.json(
        { error: deploymentCheck.error },
        { status: deploymentCheck.status },
      );
    }
    const targetApp = deploymentCheck.app;

    const planModulesForApp = await prisma.planAppModule.count({
      where: {
        plan_id: planId,
        app_module: { app_id: appId },
      },
    });
    if (planModulesForApp === 0) {
      return NextResponse.json(
        {
          error:
            "Este plan no tiene módulos configurados para esa app. Editá el plan y asigná módulos antes de crear la suscripción.",
        },
        { status: 400 },
      );
    }

    const planPrice = await prisma.planPrice.findFirst({
      where: { plan_id: planId, period },
    });
    if (!planPrice) {
      return NextResponse.json(
        {
          error:
            period === Period.MONTHLY
              ? "Este plan no tiene precio mensual"
              : "Este plan no tiene precio anual",
        },
        { status: 400 },
      );
    }

    const existingActive = await prisma.subscription.findFirst({
      where: {
        app_hash: targetApp.hash,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        plan_price: {
          include: { plan: { select: { id: true, name: true } } },
        },
      },
      orderBy: { id: "desc" },
    });

    if (existingActive && !replace) {
      return NextResponse.json(
        {
          error: "conflict_active_subscription",
          message: `${targetApp.name || "Esta app"} ya tiene un plan activo.`,
          current: {
            subscription_id: existingActive.id,
            plan_id: existingActive.plan_price.plan.id,
            plan_name: existingActive.plan_price.plan.name,
            period: existingActive.plan_price.period,
            expires_at: existingActive.expires_at?.toISOString() ?? null,
          },
          next: {
            plan_id: plan.id,
            plan_name: plan.name,
            period,
          },
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const expiresAt = new Date(now);
    if (period === Period.MONTHLY) {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    if (existingActive && replace) {
      await prisma.subscription.update({
        where: { id: existingActive.id },
        data: { status: SubscriptionStatus.CANCELED },
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        app_hash: targetApp.hash,
        plan_price_id: planPrice.id,
        start_at: now,
        expires_at: expiresAt,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    const push = await pushEntitlementToApp(subscription.app_hash);

    return NextResponse.json(
      {
        id: subscription.id,
        app_hash: subscription.app_hash,
        app_name: targetApp.name,
        plan_id: plan.id,
        plan_name: plan.name,
        plan_price_id: subscription.plan_price_id,
        period,
        status: subscription.status,
        start_at: subscription.start_at?.toISOString() ?? null,
        expires_at: subscription.expires_at?.toISOString() ?? null,
        replaced_subscription_id: existingActive?.id ?? null,
        push_ok: push.ok,
        push_skipped: push.skipped ?? false,
        push_error: push.error ?? null,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error al habilitar suscripción:", err);
    return NextResponse.json(
      { error: "Error al habilitar suscripción" },
      { status: 500 },
    );
  }
}
