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
        ...(body.owner_name !== undefined && { owner_name: String(body.owner_name).trim() }),
        ...(body.phone !== undefined && { phone: String(body.phone).trim() }),
        ...(body.ruc !== undefined && { ruc: String(body.ruc).trim() }),
        ...(body.address !== undefined && { address: String(body.address).trim() }),
        ...(body.email !== undefined && { email: String(body.email).trim() }),
      },
    });

    return NextResponse.json({
      id: app.id,
      hash: app.hash,
      name: app.name,
      owner_name: app.owner_name,
      phone: app.phone,
      ruc: app.ruc,
      address: app.address,
      email: app.email,
      created_at: app.created_at.toISOString(),
      updated_at: app.updated_at.toISOString(),
      deleted_at: null,
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
