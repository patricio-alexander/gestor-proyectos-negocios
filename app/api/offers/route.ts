import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { requireTemplateAppId } from "@/src/shared/lib/app-kind";
import { mapOffer, offerInclude } from "@/src/features/offers/lib/offer-query";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const offers = await prisma.offer.findMany({
      where: {
        deleted_at: null,
        apps: { kind: "template", deleted_at: null },
      },
      include: offerInclude,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(offers.map(mapOffer));
  } catch {
    return NextResponse.json(
      { error: "Error al obtener ofertas" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { name, app_id, price, start_at, expires_at, module_ids } =
      await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la oferta es obligatorio" },
        { status: 400 },
      );
    }

    if (!app_id) {
      return NextResponse.json(
        { error: "Debe seleccionar una aplicación" },
        { status: 400 },
      );
    }

    if (!start_at || !expires_at) {
      return NextResponse.json(
        { error: "Las fechas de inicio y vencimiento son obligatorias" },
        { status: 400 },
      );
    }

    const templateCheck = await requireTemplateAppId(Number(app_id));
    if (!templateCheck.ok) {
      return NextResponse.json(
        { error: templateCheck.error },
        { status: templateCheck.status },
      );
    }

    const offer = await prisma.offer.create({
      data: {
        name: name.trim(),
        app_id,
        price: price != null ? Number(price) : null,
        start_at: new Date(start_at),
        expires_at: new Date(expires_at),
        offersModules: module_ids?.length
          ? { create: module_ids.map((module_id: number) => ({ module_id })) }
          : undefined,
      },
      include: offerInclude,
    });

    return NextResponse.json(mapOffer(offer), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear oferta" },
      { status: 500 },
    );
  }
}
