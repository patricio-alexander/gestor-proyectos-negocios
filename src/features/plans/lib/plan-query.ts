import { prisma } from "@/src/shared/lib/prisma";

export const planInclude = {
  business: { select: { name: true } },
  prices: { select: { id: true, price: true, period: true } },
  modules: {
    select: {
      id: true,
      app_module_id: true,
      app_module: { select: { name: true, key: true } },
    },
    where: { app_module: { deleted_at: null } },
  },
  sections: {
    select: {
      id: true,
      app_section_id: true,
      app_section: { select: { name: true, key: true } },
    },
    where: { app_section: { deleted_at: null } },
  },
} as const;

export function mapPlan(plan: {
  id: number;
  name: string | null;
  business_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  business: { name: string | null };
  prices: { id: number; price: number | null; period: string }[];
  modules: {
    id: number;
    app_module_id: number;
    app_module: { name: string; key: string };
  }[];
  sections: {
    id: number;
    app_section_id: number;
    app_section: { name: string; key: string };
  }[];
}) {
  return {
    id: plan.id,
    name: plan.name,
    business_id: plan.business_id,
    business_name: plan.business.name,
    created_at: plan.created_at.toISOString(),
    updated_at: plan.updated_at.toISOString(),
    deleted_at: plan.deleted_at?.toISOString() ?? null,
    prices: plan.prices,
    modules: plan.modules.map((m) => ({
      id: m.id,
      app_module_id: m.app_module_id,
      module_name: m.app_module.name,
      module_key: m.app_module.key,
    })),
    sections: plan.sections.map((s) => ({
      id: s.id,
      app_section_id: s.app_section_id,
      section_name: s.app_section.name,
      section_key: s.app_section.key,
    })),
  };
}

export async function findPlanById(id: number) {
  return prisma.plan.findFirst({
    where: { id, deleted_at: null },
    include: planInclude,
  });
}
