import { prisma } from "@/src/shared/lib/prisma";
import { effectiveSectionStatusForApp, deriveModuleEffectiveStatus, normalizeLifecycleStatus } from "./lifecycle-status-resolve";

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

export async function buildEntitlementForAppHash(
  appHash: string,
): Promise<EntitlementPayload> {
  const app = await prisma.apps.findFirst({
    where: { hash: appHash, deleted_at: null },
    select: { id: true, maintenance: true, kind: true },
  });

  if (!app) {
    return { maintenance: false, subscribed: false, subscription: null };
  }

  const moduleChannel = app.kind === "mobile" ? "mobile" : "web";

  const subscription = await prisma.subscription.findFirst({
    where: { app_hash: appHash },
    orderBy: { id: "desc" },
    include: {
      plan_price: {
        select: {
          period: true,
          plan: {
            select: {
              name: true,
              channel: true,
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
  });

  const appModules = await prisma.appModule.findMany({
    where: {
      app_id: app.id,
      module: { deleted_at: null, channel: moduleChannel },
    },
    select: {
      module_id: true,
      status: true,
      module: {
        select: {
          id: true,
          key: true,
          name: true,
          status: true,
          channel: true,
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
  });

  const appSections = await prisma.appSection.findMany({
    where: { app_id: app.id },
    select: { section_id: true, status: true },
  });

  const sectionOverrideById = new Map(
    appSections
      .filter((as) => as.status != null)
      .map((as) => [as.section_id, as.status]),
  );

  const modules = appModules.map((am) => {
    // Todas las secciones del módulo, cada una con su status efectivo (global + override por app).
    const sections = am.module.sections.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      status: effectiveSectionStatusForApp(
        s.status,
        sectionOverrideById.get(s.id),
        am.status,
      ),
      max_records_limit: s.max_records_limit,
      usage_count: s.usage_count,
      capabilities: s.capabilities,
    }));

    const moduleStatus = deriveModuleEffectiveStatus(
      am.module.status,
      am.status,
      sections.map((s) => s.status),
    );

    return {
      id: am.module.id,
      name: am.module.name,
      key: am.module.key,
      status: moduleStatus,
      is_maintainer: am.module.is_maintainer,
      image_url: am.module.image_url,
      is_trial: am.module.is_trial,
      start_trial: am.module.start_trial,
      limit_days_trial: am.module.limit_days_trial,
      end_trial: am.module.end_trial,
      sections,
    };
  });

  const capabilitiesMapped = new Map<string, unknown[]>();

  modules.forEach((mod) =>
    (mod.sections as typeof mod.sections).forEach((s) => {
      const sectionStatus = normalizeLifecycleStatus(s.status);
      // Capabilities solo para secciones utilizables; las demás van en sections con su status.
      if (sectionStatus !== "active" && sectionStatus !== "developer") return;
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

  const offers = (subscription?.plan_price.plan.planOffers ?? []).map(
    (po) => ({
      name: po.offer.name,
      price: po.offer.price ?? null,
      start_at: po.offer.start_at.toISOString(),
      expires_at: po.offer.expires_at.toISOString(),
      modules: (po.offer.offersModules ?? []).map((om) => ({
        id: om.modules.id,
        name: om.modules.name,
      })),
    }),
  );

  return {
    maintenance: app.maintenance,
    subscribed: subscription?.status === "ACTIVE",
    subscription: {
      id: subscription?.id ?? 0,
      plan_name: subscription?.plan_price.plan.name ?? null,
      period: subscription?.plan_price.period ?? "MONTHLY",
      status: subscription?.status ?? "NONE",
      start_at: subscription?.start_at?.toISOString() ?? null,
      expires_at: subscription?.expires_at?.toISOString() ?? null,
      modules,
      capabilities: Object.fromEntries(capabilitiesMapped),
      offers,
    },
  };
}
