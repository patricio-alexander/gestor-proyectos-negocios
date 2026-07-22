import type { LifecycleStatus } from "../../../prisma/generated/prisma/enums";

/** Normaliza legacy: development → maintenance. */
export function normalizeLifecycleStatus(
  status?: LifecycleStatus | string | null,
): LifecycleStatus {
  if (status === "development") return "maintenance";
  if (
    status === "active" ||
    status === "maintenance" ||
    status === "developer" ||
    status === "planned" ||
    status === "hidden"
  ) {
    return status;
  }
  return "active";
}

/** Override por app gana; si no hay, el status global. */
export function effectiveLifecycleStatus(
  globalStatus: LifecycleStatus | string,
  overrideStatus?: LifecycleStatus | string | null,
): LifecycleStatus {
  return normalizeLifecycleStatus(
    overrideStatus != null && overrideStatus !== ""
      ? overrideStatus
      : globalStatus,
  );
}

/**
 * Status efectivo de una sección en una app.
 * Prioridad: AppSection → AppModule → Section (catálogo).
 */
export function effectiveSectionStatusForApp(
  sectionGlobalStatus: LifecycleStatus | string,
  appSectionOverride?: LifecycleStatus | string | null,
  appModuleOverride?: LifecycleStatus | string | null,
): LifecycleStatus {
  if (appSectionOverride != null && appSectionOverride !== "") {
    return normalizeLifecycleStatus(appSectionOverride);
  }
  if (appModuleOverride != null && appModuleOverride !== "") {
    return normalizeLifecycleStatus(appModuleOverride);
  }
  return normalizeLifecycleStatus(sectionGlobalStatus);
}

/**
 * Estado agregado del módulo según sus secciones efectivas.
 * Si al menos una sección está activa → el módulo está encendido.
 */
export function deriveModuleStatusFromSections(
  sections: Array<{ status: LifecycleStatus | string }>,
  fallback: LifecycleStatus | string = "maintenance",
): LifecycleStatus {
  if (sections.some((s) => normalizeLifecycleStatus(s.status) === "active")) {
    return "active";
  }
  if (sections.some((s) => normalizeLifecycleStatus(s.status) === "developer")) {
    return "developer";
  }
  if (sections.some((s) => normalizeLifecycleStatus(s.status) === "planned")) {
    return "planned";
  }
  if (
    sections.length > 0 &&
    sections.every((s) => normalizeLifecycleStatus(s.status) === "maintenance")
  ) {
    return "maintenance";
  }
  if (
    sections.length > 0 &&
    sections.every((s) => normalizeLifecycleStatus(s.status) === "hidden")
  ) {
    return "hidden";
  }
  return normalizeLifecycleStatus(fallback);
}

/**
 * Status efectivo del módulo para una app concreta.
 * Se deriva de las secciones efectivas (incluyen AppModule como default).
 * Si alguna sección está activa/developer → módulo encendido; si no, fallback AppModule → catálogo.
 */
export function deriveModuleEffectiveStatus(
  moduleGlobalStatus: LifecycleStatus | string,
  appModuleOverride: LifecycleStatus | string | null | undefined,
  sectionEffectiveStatuses: Array<LifecycleStatus | string>,
): LifecycleStatus {
  const fallback = effectiveLifecycleStatus(
    moduleGlobalStatus,
    appModuleOverride,
  );

  if (sectionEffectiveStatuses.length > 0) {
    return deriveModuleStatusFromSections(
      sectionEffectiveStatuses.map((status) => ({ status })),
      fallback,
    );
  }

  return fallback;
}
