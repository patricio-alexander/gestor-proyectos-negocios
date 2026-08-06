import { prisma } from "@/src/shared/lib/prisma";

/** Keys estables — el entitlement y los backends las usan como contrato. */
export const FEATURE_KEYS = {
  MULTI_STOCK: "multi_stock",
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

type FeatureSeed = {
  key: string;
  name: string;
  description: string;
  status: "active" | "planned" | "maintenance" | "developer" | "hidden";
  sort_order: number;
};

/** Catálogo base. Agregar aquí nuevas funciones a largo plazo. */
export const FEATURE_CATALOG_SEED: FeatureSeed[] = [
  {
    key: FEATURE_KEYS.MULTI_STOCK,
    name: "Multistock / varios locales",
    description:
      "Desbloquea en la app la opción de inventario por Bodega/sucursales. El cliente la activa en Configuración; una vez activada no vuelve a un solo local.",
    status: "planned",
    sort_order: 10,
  },
];

/** Asegura filas del catálogo (idempotente). No pisa overrides ni status ya editados. */
export async function ensureFeatureCatalog() {
  for (const def of FEATURE_CATALOG_SEED) {
    await prisma.feature.upsert({
      where: { key: def.key },
      create: {
        key: def.key,
        name: def.name,
        description: def.description,
        status: def.status,
        sort_order: def.sort_order,
      },
      update: {
        name: def.name,
        description: def.description,
        sort_order: def.sort_order,
        deleted_at: null,
      },
    });
  }
}
