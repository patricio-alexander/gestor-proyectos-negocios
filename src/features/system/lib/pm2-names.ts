import type { TrioId } from "@/src/features/system/lib/trio-apps";

/** Nombres PM2 reales en el servidor de producción. */
export const PM2_BY_TRIO: Record<TrioId, string> = {
  eddeli: process.env.NEXT_PUBLIC_PM2_EDDELI || "backendEddeli",
  store: process.env.NEXT_PUBLIC_PM2_STORE || "backendStore",
  tienda: process.env.NEXT_PUBLIC_PM2_TIENDA || "backendTienda",
};

export function pm2NameFor(trio: TrioId): string {
  return PM2_BY_TRIO[trio];
}
