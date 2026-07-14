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

export type PlanAppUsage = {
  id: number;
  name: string | null;
  hash: string;
};

type PlanRow = {
  id: number;
  name: string | null;
  app_id: number;
  sort_order: number;
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
};

/** Apps con suscripción ACTIVE vinculadas a cada plan (vía PlanPrice). */
export async function getAppsUsageByPlanIds(planIds: number[]) {
  const usage = new Map<number, PlanAppUsage[]>();
  if (planIds.length === 0) return usage;

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      plan_price: { plan_id: { in: planIds } },
    },
    select: {
      app_hash: true,
      plan_price: { select: { plan_id: true } },
      apps: { select: { id: true, name: true, hash: true } },
    },
  });

  for (const sub of subscriptions) {
    const planId = sub.plan_price.plan_id;
    const list = usage.get(planId) ?? [];
    if (!list.some((a) => a.hash === sub.apps.hash)) {
      list.push({
        id: sub.apps.id,
        name: sub.apps.name,
        hash: sub.apps.hash,
      });
    }
    usage.set(planId, list);
  }

  return usage;
}

export function mapPlan(
  plan: PlanRow,
  appsUsing: PlanAppUsage[] = [],
) {
  return {
    id: plan.id,
    name: plan.name,
    app_id: plan.app_id,
    /** App de catálogo (módulos); los planes son plantilla SoftEd. */
    catalog_app_name: plan.apps.name,
    sort_order: plan.sort_order,
    apps_count: appsUsing.length,
    apps_using: appsUsing,
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

export async function mapPlansWithUsage(plans: PlanRow[]) {
  const usage = await getAppsUsageByPlanIds(plans.map((p) => p.id));
  return plans.map((plan) => mapPlan(plan, usage.get(plan.id) ?? []));
}

export async function findPlanById(id: number) {
  return prisma.plan.findFirst({
    where: { id, deleted_at: null },
    include: planInclude,
  });
}

export async function mapPlanById(id: number) {
  const plan = await findPlanById(id);
  if (!plan) return null;
  const usage = await getAppsUsageByPlanIds([id]);
  return mapPlan(plan, usage.get(id) ?? []);
}
