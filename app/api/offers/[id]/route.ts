import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import {
  findOfferById,
  mapOffer,
  offerInclude,
} from "@/src/features/offers/lib/offer-query";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const offer = await findOfferById(Number(id));

    if (!offer) {
      return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 });
    }

    return NextResponse.json(mapOffer(offer));
  } catch {
    return NextResponse.json(
      { error: "Error al obtener la oferta" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const offerId = Number(id);
    const { name, app_id, price, start_at, expires_at, module_ids } =
      await request.json();

    const existing = await findOfferById(offerId);

    if (!existing) {
      return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 });
    }

    if (app_id) {
      const apps = await prisma.apps.findFirst({
        where: { id: app_id, deleted_at: null },
      });
      if (!apps) {
        return NextResponse.json(
          { error: "La aplicación seleccionada no existe" },
          { status: 404 },
        );
      }
    }

    const offer = await prisma.$transaction(async (tx) => {
      await tx.offer.update({
        where: { id: offerId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(app_id !== undefined && { app_id }),
          ...(price !== undefined && { price: price != null ? Number(price) : null }),
          ...(start_at !== undefined && { start_at: new Date(start_at) }),
          ...(expires_at !== undefined && { expires_at: new Date(expires_at) }),
        },
      });

      if (module_ids !== undefined) {
        await tx.offerModule.deleteMany({ where: { offer_id: offerId } });
        if (module_ids.length > 0) {
          await tx.offerModule.createMany({
            data: module_ids.map((module_id: number) => ({
              offer_id: offerId,
              module_id,
            })),
          });
        }
      }

      return tx.offer.findUnique({
        where: { id: offerId },
        include: offerInclude,
      });
    });

    return NextResponse.json(mapOffer(offer!));
  } catch (err) {
    console.error("Error al actualizar oferta:", err);
    return NextResponse.json(
      { error: "Error al actualizar la oferta" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const existing = await findOfferById(Number(id));

    if (!existing) {
      return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 });
    }

    await prisma.offer.update({
      where: { id: Number(id) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar la oferta" },
      { status: 500 },
    );
  }
}
