import { prisma } from "@/src/shared/lib/prisma";
import {
  pushEntitlementToApp,
  toPushResponseFields,
  type PushEntitlementOutcome,
} from "./push-entitlement";
import { buildEntitlementForAppHash } from "./entitlement-payload";
import type { LifecycleStatus } from "../../../prisma/generated/prisma/enums";
import {
  deriveModuleStatusFromSections,
  normalizeLifecycleStatus,
} from "./lifecycle-status-resolve";

export async function pushEntitlementForAppId(appId: number) {
  const app = await prisma.apps.findFirst({
    where: { id: appId, deleted_at: null },
    select: { hash: true },
  });
  if (!app) return { ok: false, error: "App no encontrada" } as PushEntitlementOutcome;
  return pushEntitlementToApp(app.hash);
}

export async function buildEntitlementForAppId(appId: number) {
  const app = await prisma.apps.findFirst({
    where: { id: appId, deleted_at: null },
    select: { hash: true },
  });
  if (!app) {
    return { maintenance: false, subscribed: false, subscription: null };
  }
  return buildEntitlementForAppHash(app.hash);
}

export function moduleSectionsFromEntitlement(
  payload: Awaited<ReturnType<typeof buildEntitlementForAppId>>,
  moduleId: number,
) {
  const mod = payload.subscription?.modules?.find(
    (m) => (m as { id?: number }).id === moduleId,
  ) as
    | {
        status?: string;
        sections?: Array<{
          id: number;
          name: string;
          key: string | null;
          status: string;
        }>;
      }
    | undefined;
  if (!mod?.sections) return null;
  return {
    module_status: mod.status ?? null,
    sections: mod.sections.map((s) => ({
      id: s.id,
      name: s.name,
      key: s.key,
      status: s.status,
    })),
  };
}

export async function pushEntitlementForModuleToAllUsers(
  moduleId: number,
): Promise<ReturnType<typeof toPushResponseFields>> {
  const appModules = await prisma.appModule.findMany({
    where: { module_id: moduleId },
    select: {
      app: { select: { hash: true } },
    },
  });

  const hashes = [...new Set(appModules.map((am) => am.app.hash))];

  if (hashes.length === 0) {
    return { push_ok: false, push_skipped: true, push_error: null };
  }

  const results = await Promise.all(hashes.map((h) => pushEntitlementToApp(h)));
  const failed = results.find((r) => !r.ok && !r.skipped);
  const allSkipped = results.every((r) => r.skipped);
  if (failed) {
    return {
      push_ok: false,
      push_skipped: false,
      push_error: failed.error ?? "Error al empujar a una o más apps",
    };
  }
  if (allSkipped) {
    return { push_ok: false, push_skipped: true, push_error: null };
  }
  return { push_ok: true, push_skipped: false, push_error: null };
}

/** @deprecated prefer pushEntitlementForModuleToAllUsers for global status changes */
export async function pushEntitlementForModuleId(moduleId: number) {
  return pushEntitlementForModuleToAllUsers(moduleId);
}

export async function pushEntitlementForSectionId(sectionId: number) {
  const sec = await prisma.section.findFirst({
    where: { id: sectionId, deleted_at: null },
    select: { module_id: true },
  });
  if (!sec) {
    return { push_ok: false, push_skipped: true, push_error: "Sección no encontrada" };
  }
  return pushEntitlementForModuleToAllUsers(sec.module_id);
}

export async function syncModuleGlobalStatusFromSections(
  moduleId: number,
): Promise<LifecycleStatus | null> {
  const mod = await prisma.module.findFirst({
    where: { id: moduleId, deleted_at: null },
    select: {
      id: true,
      status: true,
      sections: {
        where: { deleted_at: null },
        select: { status: true },
      },
    },
  });
  if (!mod) return null;

  const derived = deriveModuleStatusFromSections(mod.sections, mod.status);
  if (normalizeLifecycleStatus(mod.status) !== derived) {
    await prisma.module.update({
      where: { id: mod.id },
      data: { status: derived },
    });
  }
  return derived;
}

export async function resetModulePerAppOverrides(moduleId: number) {
  const sections = await prisma.section.findMany({
    where: { module_id: moduleId, deleted_at: null },
    select: { id: true },
  });
  const sectionIds = sections.map((s) => s.id);

  await prisma.appModule.updateMany({
    where: { module_id: moduleId },
    data: { status: null },
  });

  if (sectionIds.length > 0) {
    await prisma.appSection.deleteMany({
      where: { section_id: { in: sectionIds } },
    });
  }
}

export async function cascadeModuleStatusToSections(
  moduleId: number,
  status: LifecycleStatus,
) {
  await prisma.section.updateMany({
    where: { module_id: moduleId, deleted_at: null },
    data: { status },
  });
}

export async function applyGlobalModuleStatus(
  moduleId: number,
  status: LifecycleStatus,
) {
  const mod = await prisma.module.findFirst({
    where: { id: moduleId, deleted_at: null },
    select: { id: true },
  });
  if (!mod) throw new Error("Módulo no encontrado");

  await prisma.module.update({
    where: { id: moduleId },
    data: { status },
  });
  await cascadeModuleStatusToSections(moduleId, status);
  await resetModulePerAppOverrides(moduleId);

  return pushEntitlementForModuleToAllUsers(moduleId);
}

export async function applyGlobalSectionStatus(
  sectionId: number,
  status: LifecycleStatus,
) {
  const sec = await prisma.section.findFirst({
    where: { id: sectionId, deleted_at: null },
    select: {
      id: true,
      key: true,
      module: { select: { id: true, key: true } },
    },
  });
  if (!sec) throw new Error("Sección no encontrada");

  const moduleKey = sec.module.key;
  const sectionKey = sec.key;

  if (sectionKey) {
    const siblingModules = await prisma.module.findMany({
      where: { key: moduleKey, deleted_at: null },
      select: { id: true },
    });
    const moduleIds = siblingModules.map((m) => m.id);
    await prisma.section.updateMany({
      where: {
        module_id: { in: moduleIds },
        key: sectionKey,
        deleted_at: null,
      },
      data: { status },
    });
  } else {
    await prisma.section.update({
      where: { id: sectionId },
      data: { status },
    });
  }

  await syncModuleGlobalStatusFromSections(sec.module.id);

  return pushEntitlementForModuleToAllUsers(sec.module.id);
}
