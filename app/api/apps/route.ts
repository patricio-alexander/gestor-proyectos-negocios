import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const apps = await prisma.apps.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: "desc" },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { id: "desc" },
          take: 1,
          include: {
            plan_price: {
              include: {
                plan: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        app_modules: {
          select: {
            module: {
              select: { id: true, name: true, key: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      apps.map((a) => {
        const sub = a.subscriptions[0] ?? null;
        const plan = sub?.plan_price.plan ?? null;
        return {
          id: a.id,
          hash: a.hash,
          name: a.name,
          kind: a.kind,
          owner_name: a.owner_name,
          phone: a.phone,
          ruc: a.ruc,
          address: a.address,
          email: a.email,
          path: a.path,
          database_name: a.database_name,
          images_size: a.images_size,
          database_size: a.database_size,
          maintenance: a.maintenance,
          entitlement_url: a.entitlement_url,
          entitlement_secret: a.entitlement_secret,
          has_entitlement_secret: Boolean(a.entitlement_secret),
          created_at: a.created_at.toISOString(),
          updated_at: a.updated_at.toISOString(),
          deleted_at: a.deleted_at?.toISOString() ?? null,
          subscription: sub
            ? {
                id: sub.id,
                status: sub.status,
                start_at: sub.start_at?.toISOString() ?? null,
                expires_at: sub.expires_at?.toISOString() ?? null,
                period: sub.plan_price.period,
              }
            : null,
          plan: plan
            ? {
                id: plan.id,
                name: plan.name,
              }
            : null,
          modules: a.app_modules.map((am) => ({
            id: am.module.id,
            key: am.module.key,
            name: am.module.name,
          })),
        };
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "Error al obtener aplicaciones" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      name,
      owner_name,
      phone,
      ruc,
      address,
      email,
      path,
      database_name,
      images_size,
      database_size,
      maintenance,
      entitlement_url,
      entitlement_secret,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la aplicación es obligatorio" },
        { status: 400 },
      );
    }

    const hash = crypto.randomBytes(16).toString("hex");
    const app = await prisma.apps.create({
      data: {
        hash,
        name: name.trim(),
        owner_name: owner_name?.trim() ?? null,
        phone: phone?.trim() ?? null,
        ruc: ruc?.trim() ?? null,
        address: address?.trim() ?? null,
        email: email?.trim() ?? null,
        path: path?.trim() ?? null,
        database_name: database_name?.trim() ?? null,
        images_size: images_size ?? null,
        database_size: database_size ?? null,
        maintenance: maintenance ?? false,
        entitlement_url: entitlement_url?.trim() || null,
        entitlement_secret: entitlement_secret?.trim() || null,
        kind: "deployment",
        app_modules: {
          create: await prisma.module
            .findMany({
              where: { deleted_at: null },
              select: { id: true },
            })
            .then((modules) =>
              modules.map((m) => ({ module_id: m.id })),
            ),
        },
      },
    });

    return NextResponse.json(
      {
        id: app.id,
        hash: app.hash,
        name: app.name,
        kind: app.kind,
        owner_name: app.owner_name,
        phone: app.phone,
        ruc: app.ruc,
        address: app.address,
        email: app.email,
        path: app.path,
        database_name: app.database_name,
        images_size: app.images_size,
        database_size: app.database_size,
        maintenance: app.maintenance,
        entitlement_url: app.entitlement_url,
        entitlement_secret: app.entitlement_secret,
        has_entitlement_secret: Boolean(app.entitlement_secret),
        created_at: app.created_at.toISOString(),
        updated_at: app.updated_at.toISOString(),
        deleted_at: null,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error creating app:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al crear aplicación" },
      { status: 500 },
    );
  }
}
