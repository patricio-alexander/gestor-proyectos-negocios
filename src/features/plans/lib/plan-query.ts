import { prisma } from "@/src/shared/lib/prisma";

export const planInclude = {
  prices: { select: { id: true, price: true, period: true } },
  plan_app_modules: {
    select: {
      app_module: {
        select: {
          id: true,
          app_id: true,
          module_id: true,
          app: { select: { id: true, name: true } },
          module: { select: { name: true, is_trial: true } },
        },
      },
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
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  prices: { id: number; price: number | null; period: string }[];
  plan_app_modules: {
    app_module: {
      id: number;
      app_id: number;
      module_id: number;
      app: { id: number; name: string | null };
      module: { name: string; is_trial: boolean };
    };
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

  const planPrices = await prisma.planPrice.findMany({
    where: { plan_id: { in: planIds } },
    select: { id: true, plan_id: true },
  });
  if (planPrices.length === 0) return usage;

  const priceIdToPlanId = new Map(planPrices.map((pp) => [pp.id, pp.plan_id]));

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      plan_price_id: { in: planPrices.map((pp) => pp.id) },
    },
    select: {
      plan_price_id: true,
      apps: { select: { id: true, name: true, hash: true } },
    },
  });

  for (const sub of subscriptions) {
    const planId = priceIdToPlanId.get(sub.plan_price_id);
    if (planId == null) continue;
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

export function mapPlan(plan: PlanRow, appsUsing: PlanAppUsage[] = []) {
  const appIds = [
    ...new Set(plan.plan_app_modules.map((pam) => pam.app_module.app_id)),
  ];
  const catalogAppNames = [
    ...new Set(
      plan.plan_app_modules
        .map((pam) => pam.app_module.app.name)
        .filter(Boolean),
    ),
  ] as string[];

  return {
    id: plan.id,
    name: plan.name,
    app_ids: appIds,
    catalog_app_names: catalogAppNames,
    sort_order: plan.sort_order,
    apps_count: appsUsing.length,
    apps_using: appsUsing,
    created_at: plan.created_at.toISOString(),
    updated_at: plan.updated_at.toISOString(),
    deleted_at: plan.deleted_at?.toISOString() ?? null,
    prices: plan.prices,
    plan_modules: plan.plan_app_modules.map((pam) => ({
      id: pam.app_module.id,
      app_id: pam.app_module.app_id,
      app_name: pam.app_module.app.name,
      module_id: pam.app_module.module_id,
      module_name: pam.app_module.module.name,
      is_trial: pam.app_module.module.is_trial,
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
