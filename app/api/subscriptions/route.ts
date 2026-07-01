import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser, validateApiKey } from "@/src/shared/lib/api-auth";
import {
  Period,
  SubscriptionStatus,
  LicenseStatus,
} from "../../../prisma/generated/prisma/enums";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        apps: { select: { name: true } },
        plan_price: {
          include: { plan: { select: { name: true } } },
        },
      },
      orderBy: { id: "desc" },
    });

    const result = subscriptions.map((s) => ({
      id: s.id,
      business_hash: s.business_hash,
      business_name: s.apps.name,
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
  const apiKey = await validateApiKey(request);
  if (apiKey.error) return apiKey.error;

  try {
    const { license_key }: { license_key: string } = await request.json();

    if (!license_key || !license_key.trim()) {
      return NextResponse.json(
        { error: "La clave de licencia es obligatoria" },
        { status: 400 },
      );
    }

    const license = await prisma.license.findFirst({
      where: { key: license_key.trim() },
      include: {
        plan_price: {
          include: {
            plan: {
              include: { apps: { select: { hash: true } } },
            },
          },
        },
      },
    });

    if (!license) {
      return NextResponse.json(
        { error: "Licencia no encontrada" },
        { status: 404 },
      );
    }

    if (license.status === "USED") {
      return NextResponse.json(
        { error: "Esta licencia ya ha sido usada" },
        { status: 400 },
      );
    }
    if (license.status === "REVOKED") {
      return NextResponse.json(
        { error: "Esta licencia ha sido revocada" },
        { status: 400 },
      );
    }

    if (!license.plan_price) {
      return NextResponse.json(
        { error: "La licencia no tiene un precio de plan asociado" },
        { status: 400 },
      );
    }

    const now = new Date();
    let expiresAt: Date;

    if (license.plan_price.period === Period.MONTHLY) {
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const subscription = await prisma.subscription.create({
      data: {
        business_hash: license.plan_price.plan.apps.hash,
        plan_price_id: license.plan_price_id,
        start_at: now,
        expires_at: expiresAt,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    await prisma.license.update({
      where: { id: license.id },
      data: {
        sub_id: subscription.id,
        status: LicenseStatus.USED,
        used_at: now,
      },
    });

    return NextResponse.json(
      {
        id: subscription.id,
        business_hash: subscription.business_hash,
        plan_price_id: subscription.plan_price_id,
        start_at: subscription.start_at?.toISOString() ?? null,
        expires_at: subscription.expires_at?.toISOString() ?? null,
        status: subscription.status,
        license_key: license.key,
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
