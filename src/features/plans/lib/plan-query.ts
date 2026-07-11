import { prisma } from "@/src/shared/lib/prisma";

export const planInclude = {
  apps: { select: { name: true } },
  prices: { select: { id: true, price: true, period: true } },
  plan_modules: {
    select: {
      id: true,
      module_id: true,
      module: { select: { name: true, is_trial: true } },
    },
  },
  planOffers: {
    select: {
      offer_id: true,
      offer: { select: { name: true } },
    },
  },
} as const;

export function mapPlan(plan: {
  id: number;
  name: string | null;
  app_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  apps: { name: string | null };
  prices: { id: number; price: number | null; period: string }[];
  plan_modules: {
    id: number;
    module_id: number;
    module: { name: string; is_trial: boolean };
  }[];
  planOffers: {
    offer_id: number;
    offer: { name: string };
  }[];
}) {
  return {
    id: plan.id,
    name: plan.name,
    app_id: plan.app_id,
    app_name: plan.apps.name,
    created_at: plan.created_at.toISOString(),
    updated_at: plan.updated_at.toISOString(),
    deleted_at: plan.deleted_at?.toISOString() ?? null,
    prices: plan.prices,
    plan_modules: plan.plan_modules.map((pm) => ({
      id: pm.id,
      module_id: pm.module_id,
      module_name: pm.module.name,
      is_trial: pm.module.is_trial,
    })),
    plan_offers: plan.planOffers.map((po) => ({
      offer_id: po.offer_id,
      offer_name: po.offer.name,
    })),
  };
}

export async function findPlanById(id: number) {
  return prisma.plan.findFirst({
    where: { id, deleted_at: null },
    include: planInclude,
  });
}
