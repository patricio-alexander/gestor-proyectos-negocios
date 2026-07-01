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
    });

    return NextResponse.json(
      apps.map((a) => ({
        id: a.id,
        hash: a.hash,
        name: a.name,
        owner_name: a.owner_name,
        phone: a.phone,
        ruc: a.ruc,
        address: a.address,
        email: a.email,
        created_at: a.created_at.toISOString(),
        updated_at: a.updated_at.toISOString(),
        deleted_at: a.deleted_at?.toISOString() ?? null,
      })),
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
    const { name, owner_name, phone, ruc, address, email } = body;

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
      },
    });

    return NextResponse.json(
      {
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
