import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import type { CreateBusinessInput } from "@/src/features/businesses/types";
import crypto from "crypto";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;
  try {
    const businesses = await prisma.business.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(businesses);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener negocios" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { name, owner_name, phone, ruc, address, email }: CreateBusinessInput =
      await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre del negocio es obligatorio" },
        { status: 400 }
      );
    }

    const hash = crypto.randomBytes(4).toString("hex");

    const business = await prisma.business.create({
      data: {
        hash,
        name: name.trim(),
        owner_name: owner_name?.trim() || null,
        phone: phone?.trim() || null,
        ruc: ruc?.trim() || null,
        address: address?.trim() || null,
        email: email?.trim() || null,
      },
    });

    return NextResponse.json(business, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear negocio" },
      { status: 500 }
    );
  }
}
