import { prisma } from "@/src/shared/lib/prisma";

export const offerInclude = {
  apps: { select: { name: true } },
  offersModules: {
    select: {
      module_id: true,
      modules: { select: { name: true } },
    },
  },
} as const;

export function mapOffer(offer: {
  id: number;
  app_id: number;
  name: string;
  price: number | null;
  start_at: Date;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  apps: { name: string | null };
  offersModules: {
    module_id: number;
    modules: { name: string };
  }[];
}) {
  return {
    id: offer.id,
    app_id: offer.app_id,
    app_name: offer.apps.name,
    name: offer.name,
    price: offer.price,
    start_at: offer.start_at.toISOString(),
    expires_at: offer.expires_at.toISOString(),
    created_at: offer.created_at.toISOString(),
    updated_at: offer.updated_at.toISOString(),
    deleted_at: offer.deleted_at?.toISOString() ?? null,
    modules: offer.offersModules.map((om) => ({
      module_id: om.module_id,
      module_name: om.modules.name,
    })),
  };
}

export async function findOfferById(id: number) {
  return prisma.offer.findFirst({
    where: { id, deleted_at: null },
    include: offerInclude,
  });
}
