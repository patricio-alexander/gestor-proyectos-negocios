import type { LifecycleStatus } from "../../../prisma/generated/prisma/enums";

/** Override por app gana; si no hay, el status global. */
export function effectiveLifecycleStatus(
  globalStatus: LifecycleStatus | string,
  overrideStatus?: LifecycleStatus | string | null,
): LifecycleStatus {
  const raw = (overrideStatus ?? globalStatus) as string;
  if (raw === "development") return "maintenance";
  if (
    raw === "active" ||
    raw === "maintenance" ||
    raw === "developer" ||
    raw === "planned"
  ) {
    return raw;
  }
  return "active";
}
