export type LifecycleStatus =
  | "active"
  | "development"
  | "maintenance"
  | "developer"
  | "planned";

export type NormalizedLifecycleStatus = Exclude<LifecycleStatus, "development">;

export type Capability = {
  id: number;
  section_id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Section = {
  id: number;
  name: string;
  module_id: number;
  key: string | null;
  status: LifecycleStatus;
  max_records_limit: number | null;
  usage_count: number;
  capabilities?: Capability[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type LinkedApp = {
  id: number;
  name: string | null;
  hash: string;
};

export type Module = {
  id: number;
  name: string;
  key: string;
  app_id: number;
  description: string | null;
  image_url: string | null;
  status: LifecycleStatus;
  is_maintainer: boolean;
  is_trial: boolean;
  limit_days_trial: number | null;
  start_trial: string | null;
  end_trial: string | null;
  app_name?: string | null;
  catalog_app_name?: string | null;
  apps_count?: number;
  apps_using?: LinkedApp[];
  sections: Section[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateModuleInput = {
  name: string;
  app_id: number;
  description?: string | null;
  image_url?: string | null;
  status?: LifecycleStatus;
};

export type UpdateModuleInput = {
  name?: string;
  description?: string | null;
  image_url?: string | null;
  status?: LifecycleStatus;
  is_maintainer?: boolean;
  is_trial?: boolean;
  limit_days_trial?: number | null;
  start_trial?: string | null;
  end_trial?: string | null;
};

export type CreateSectionInput = {
  name: string;
  module_id: number;
  key?: string | null;
  status?: LifecycleStatus;
  max_records_limit?: number | null;
};

export type UpdateSectionInput = {
  name?: string;
  key?: string | null;
  status?: LifecycleStatus;
  max_records_limit?: number | null;
};

export type CreateCapabilityInput = {
  section_id: number;
  code: string;
  name: string;
};

export type UpdateCapabilityInput = {
  name?: string;
  is_active?: boolean;
};

/** Etiquetas UI. `development` queda como alias legacy de mantenimiento. */
export const LIFECYCLE_STATUS_LABELS: Record<LifecycleStatus, string> = {
  active: "En uso",
  development: "Mantenimiento",
  maintenance: "Mantenimiento",
  developer: "Solo desarrollador",
  planned: "Próximamente",
};

/** Opciones editables (4 estados). */
export const LIFECYCLE_STATUS_OPTIONS = [
  "active",
  "maintenance",
  "planned",
  "developer",
] as const satisfies readonly LifecycleStatus[];

/** Normaliza legacy: development → maintenance. */
export function normalizeLifecycleStatus(
  status?: LifecycleStatus | string | null,
): NormalizedLifecycleStatus {
  if (status === "development") return "maintenance";
  if (
    status === "active" ||
    status === "maintenance" ||
    status === "developer" ||
    status === "planned"
  ) {
    return status;
  }
  return "active";
}

/** Compara filtros UI (mantenimiento incluye development). */
export function matchesLifecycleFilter(
  status: LifecycleStatus | string | null | undefined,
  filter: LifecycleStatus | "all",
) {
  if (filter === "all") return true;
  return normalizeLifecycleStatus(status) === filter;
}
