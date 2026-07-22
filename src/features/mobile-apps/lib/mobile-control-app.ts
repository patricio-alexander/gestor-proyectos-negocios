import crypto from "crypto";
import { prisma } from "@/src/shared/lib/prisma";

/** Hash estable para la fila Apps de una app móvil. */
export function mobileControlHash(key: string): string {
  return crypto
    .createHash("sha256")
    .update(`mobile-app:${key}`)
    .digest("hex")
    .slice(0, 32);
}

type MobileRow = {
  id: number;
  key: string;
  name: string;
  app_id: number | null;
};

/**
 * Asegura que exista una fila `Apps` (kind=mobile) enlazada a MobileApp
 * para AppModule / AppSection / estados de ciclo de vida.
 */
export async function ensureMobileControlApp(
  mobile: MobileRow,
): Promise<number> {
  if (mobile.app_id) {
    const existing = await prisma.apps.findFirst({
      where: { id: mobile.app_id, deleted_at: null },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  const hash = mobileControlHash(mobile.key);

  const byHash = await prisma.apps.findFirst({
    where: { hash, deleted_at: null },
    select: { id: true },
  });

  if (byHash) {
    await prisma.mobileApp.update({
      where: { id: mobile.id },
      data: { app_id: byHash.id },
    });
    await prisma.apps.update({
      where: { id: byHash.id },
      data: { name: mobile.name, kind: "mobile" },
    });
    return byHash.id;
  }

  const created = await prisma.apps.create({
    data: {
      hash,
      name: mobile.name,
      kind: "mobile",
      path: `mobile://${mobile.key}`,
    },
  });

  await prisma.mobileApp.update({
    where: { id: mobile.id },
    data: { app_id: created.id },
  });

  return created.id;
}

export async function syncMobileControlAppName(
  appId: number | null | undefined,
  name: string,
) {
  if (!appId) return;
  await prisma.apps.updateMany({
    where: { id: appId, deleted_at: null, kind: "mobile" },
    data: { name },
  });
}

export async function softDeleteMobileControlApp(
  appId: number | null | undefined,
) {
  if (!appId) return;
  await prisma.apps.updateMany({
    where: { id: appId, deleted_at: null, kind: "mobile" },
    data: { deleted_at: new Date() },
  });
}
