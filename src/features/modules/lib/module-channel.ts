import type { ModuleChannel } from "../../../../prisma/generated/prisma/enums";

export function isWebChannel(
  channel: ModuleChannel | string | null | undefined,
): boolean {
  return channel == null || channel === "web";
}

export function isMobileChannel(
  channel: ModuleChannel | string | null | undefined,
): boolean {
  return channel === "mobile";
}

/** App kind compatible con el canal del módulo. */
export function appKindMatchesChannel(
  appKind: string | null | undefined,
  channel: ModuleChannel | string | null | undefined,
): boolean {
  if (isMobileChannel(channel)) return appKind === "mobile";
  // web: deployments (y legacy sin kind); nunca template ni mobile
  return appKind === "deployment" || appKind == null;
}
