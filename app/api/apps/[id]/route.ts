import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const app = await prisma.apps.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!app) {
      return NextResponse.json(
        { error: "Aplicación no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: app.id,
      hash: app.hash,
      name: app.name,
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
      deleted_at: app.deleted_at?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener la aplicación" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.apps.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Aplicación no encontrada" },
        { status: 404 },
      );
    }

    const app = await prisma.apps.update({
      where: { id: Number(id) },
      data: {
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.owner_name !== undefined && { owner_name: body.owner_name === null ? null : String(body.owner_name).trim() }),
        ...(body.phone !== undefined && { phone: body.phone === null ? null : String(body.phone).trim() }),
        ...(body.ruc !== undefined && { ruc: body.ruc === null ? null : String(body.ruc).trim() }),
        ...(body.address !== undefined && { address: body.address === null ? null : String(body.address).trim() }),
        ...(body.email !== undefined && { email: body.email === null ? null : String(body.email).trim() }),
        ...(body.path !== undefined && { path: body.path === null ? null : String(body.path).trim() }),
        ...(body.database_name !== undefined && { database_name: body.database_name === null ? null : String(body.database_name).trim() }),
        ...(body.images_size !== undefined && { images_size: Number(body.images_size) }),
        ...(body.database_size !== undefined && { database_size: Number(body.database_size) }),
        ...(body.maintenance !== undefined && { maintenance: Boolean(body.maintenance) }),
        ...(body.entitlement_url !== undefined && {
          entitlement_url:
            body.entitlement_url === null
              ? null
              : String(body.entitlement_url).trim(),
        }),
        ...(body.entitlement_secret !== undefined && {
          entitlement_secret:
            body.entitlement_secret === null
              ? null
              : String(body.entitlement_secret).trim(),
        }),
      },
    });

    let pushFields = {
      push_ok: false,
      push_skipped: true,
      push_error: null as string | null,
    };

    const shouldPush =
      body.maintenance !== undefined ||
      body.entitlement_url !== undefined ||
      body.entitlement_secret !== undefined;

    if (shouldPush) {
      const { pushEntitlementToApp, toPushResponseFields } = await import(
        "@/src/shared/lib/push-entitlement"
      );
      pushFields = toPushResponseFields(await pushEntitlementToApp(app.hash));
    }

    return NextResponse.json({
      id: app.id,
      hash: app.hash,
      name: app.name,
      owner_name: app.owner_name,
      phone: app.phone,
      ruc: app.ruc,
      address: app.address,
      email: app.email,
      path: app.path,
      database_name: app.database_name,
      maintenance: app.maintenance,
      entitlement_url: app.entitlement_url,
      entitlement_secret: app.entitlement_secret,
      has_entitlement_secret: Boolean(app.entitlement_secret),
      created_at: app.created_at.toISOString(),
      updated_at: app.updated_at.toISOString(),
      deleted_at: null,
      ...pushFields,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar la aplicación" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const existing = await prisma.apps.findFirst({
      where: { id: Number(id), deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Aplicación no encontrada" },
        { status: 404 },
      );
    }

    await prisma.apps.update({
      where: { id: Number(id) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar la aplicación" },
      { status: 500 },
    );
  }
}
