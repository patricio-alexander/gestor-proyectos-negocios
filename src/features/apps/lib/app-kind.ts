import type { AppKind } from "@/src/features/apps/types";

export function isTemplateApp(app: { kind?: AppKind | null }): boolean {
  return app.kind === "template";
}

/** App web desplegada (EdDeli, Store…). Sin kind se trata como deployment. */
export function isDeploymentApp(app: { kind?: AppKind | null }): boolean {
  return app.kind === "deployment" || app.kind == null;
}

/** App móvil (ChilePan…) en el control plane. */
export function isMobileApp(app: { kind?: AppKind | null }): boolean {
  return app.kind === "mobile";
}

/** Se puede asignar a módulos/secciones (web o móvil; no plantilla). */
export function isAssignableApp(app: { kind?: AppKind | null }): boolean {
  return app.kind !== "template";
}

export function filterTemplateApps<T extends { kind?: AppKind | null }>(
  apps: T[],
): T[] {
  return apps.filter(isTemplateApp);
}

export function filterDeploymentApps<T extends { kind?: AppKind | null }>(
  apps: T[],
): T[] {
  return apps.filter((a) => a.kind === "deployment" || a.kind == null);
}

export function filterAssignableApps<T extends { kind?: AppKind | null }>(
  apps: T[],
): T[] {
  return apps.filter(isAssignableApp);
}
