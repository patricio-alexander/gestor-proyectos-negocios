import { prisma } from "@/src/shared/lib/prisma";
import { pushEntitlementToApp } from "./push-entitlement";

/** Empuja entitlement a una app por id. */
export async function pushEntitlementForAppId(appId: number) {
  const app = await prisma.apps.findFirst({
    where: { id: appId, deleted_at: null },
    select: { hash: true },
  });
  if (!app) return { ok: false, error: "App no encontrada" };
  return pushEntitlementToApp(app.hash);
}

/** Empuja a la app dueña del módulo (catálogo). */
export async function pushEntitlementForModuleId(moduleId: number) {
  const mod = await prisma.module.findFirst({
    where: { id: moduleId, deleted_at: null },
    select: { app_id: true },
  });
  if (!mod) return { ok: false, error: "Módulo no encontrado" };
  return pushEntitlementForAppId(mod.app_id);
}

/** Empuja a la app dueña de la sección (via módulo). */
export async function pushEntitlementForSectionId(sectionId: number) {
  const sec = await prisma.section.findFirst({
    where: { id: sectionId, deleted_at: null },
    select: { module_id: true },
  });
  if (!sec) return { ok: false, error: "Sección no encontrada" };
  return pushEntitlementForModuleId(sec.module_id);
}
