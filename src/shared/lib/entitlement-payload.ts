import { prisma } from "@/src/shared/lib/prisma";

export type EntitlementPayload = {
  maintenance: boolean;
  subscribed: boolean;
  subscription: null | {
    id: number;
    plan_name: string | null;
    period: string;
    status: string;
    start_at: string | null;
    expires_at: string | null;
    modules: unknown[];
    capabilities: Record<string, unknown>;
    offers: unknown[];
  };
};

/** Arma el mismo payload que GET /api/subscriptions/check para un app_hash. */
export async function buildEntitlementForAppHash(
  appHash: string,
): Promise<EntitlementPayload> {
  const app = await prisma.apps.findFirst({
    where: { hash: appHash, deleted_at: null },
    select: { maintenance: true },
  });

  if (!app) {
    return { maintenance: false, subscribed: false, subscription: null };
  }

  const subscription = await prisma.subscription.findFirst({
    where: { app_hash: appHash },
    include: {
      plan_price: {
        include: {
          plan: {
            select: {
              name: true,
              plan_modules: {
                select: {
                  module: {
                    select: {
                      id: true,
                      key: true,
                      name: true,
                      status: true,
                      is_maintainer: true,
                      is_trial: true,
                      limit_days_trial: true,
                      start_trial: true,
                      end_trial: true,
                      image_url: true,
                      sections: {
                        where: { deleted_at: null },
                        select: {
                          id: true,
                          key: true,
                          name: true,
                          status: true,
                          max_records_limit: true,
                          usage_count: true,
                          capabilities: {
                            select: {
                              code: true,
                              name: true,
                              is_active: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              planOffers: {
                select: {
                  offer: {
                    select: {
                      name: true,
                      price: true,
                      start_at: true,
                      expires_at: true,
                      offersModules: {
                        select: {
                          modules: {
                            select: { id: true, name: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  });

  if (!subscription) {
    return {
      maintenance: app.maintenance,
      subscribed: false,
      subscription: null,
    };
  }

  const plan = subscription.plan_price.plan;

  const modules = plan.plan_modules.map((pm) => ({
    id: pm.module.id,
    name: pm.module.name,
    key: pm.module.key,
    status: pm.module.status,
    is_maintainer: pm.module.is_maintainer,
    image_url: pm.module.image_url,
    is_trial: pm.module.is_trial,
    start_trial: pm.module.start_trial,
    limit_days_trial: pm.module.limit_days_trial,
    end_trial: pm.module.end_trial,
    sections: pm.module.sections.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      status: s.status,
      max_records_limit: s.max_records_limit,
      usage_count: s.usage_count,
      capabilities: s.capabilities,
    })),
  }));

  const capabilitiesMapped = new Map<string, unknown[]>();

  plan.plan_modules.forEach((pm) =>
    pm.module.sections.forEach((s) => {
      if (!capabilitiesMapped.has(s.key ?? "")) {
        capabilitiesMapped.set(s.key ?? "", []);
      }
      const availableCapabilities = s.capabilities.map((c) => [
        c.code,
        c.is_active,
      ]);
      capabilitiesMapped
        .get(s.key ?? "")!
        .push(Object.fromEntries(availableCapabilities));
    }),
  );

  const offers = (plan.planOffers ?? []).map((po) => ({
    name: po.offer.name,
    price: po.offer.price ?? null,
    start_at: po.offer.start_at.toISOString(),
    expires_at: po.offer.expires_at.toISOString(),
    modules: (po.offer.offersModules ?? []).map((om) => ({
      id: om.modules.id,
      name: om.modules.name,
    })),
  }));

  return {
    maintenance: app.maintenance,
    subscribed: subscription.status === "ACTIVE",
    subscription: {
      id: subscription.id,
      plan_name: plan.name,
      period: subscription.plan_price.period,
      status: subscription.status,
      start_at: subscription.start_at?.toISOString() ?? null,
      expires_at: subscription.expires_at?.toISOString() ?? null,
      modules,
      capabilities: Object.fromEntries(capabilitiesMapped),
      offers,
    },
  };
}
