import type { AppKind } from "@/src/features/apps/types";

export function isTemplateApp(app: { kind?: AppKind | null }): boolean {
  return app.kind === "template";
}

export function isDeploymentApp(app: { kind?: AppKind | null }): boolean {
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
  return apps.filter(isDeploymentApp);
}

export function templateAppLabel(app: { name?: string | null }): string {
  return app.name ? `Plantilla ${app.name}` : "Plantilla Raptor";
}
