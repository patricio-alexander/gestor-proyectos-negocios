import { prisma } from "@/src/shared/lib/prisma";
import { sealSecret } from "@/src/shared/lib/secret-crypto";
import { pushEntitlementToApp } from "@/src/shared/lib/push-entitlement";

type LocalAppAlign = {
  names: string[];
  url: string;
  secret: string;
};

/**
 * Tras importar un backup de producción, los entitlement_secret vienen cifrados
 * con otra GESTOR_SECRETS_KEY/JWT y no sirven en local → webhooks (app-load) dan 401.
 * Reaplica secretos/URLs locales desde .env y empuja entitlement.
 */
export async function realignLocalEntitlementsAfterRestore(): Promise<{
  updated: string[];
  pushed: string[];
  warnings: string[];
}> {
  const isLocal =
    process.env.NODE_ENV !== "production" ||
    String(process.env.REALIGN_ENTITLEMENTS_AFTER_RESTORE || "") === "1";

  // En prod solo si se fuerza explícitamente
  if (!isLocal && String(process.env.REALIGN_ENTITLEMENTS_AFTER_RESTORE) !== "1") {
    return { updated: [], pushed: [], warnings: [] };
  }

  const targets: LocalAppAlign[] = [
    {
      names: ["EdDeli", "eddeli", "EDDELI"],
      url:
        process.env.EDDELI_ENTITLEMENT_URL?.trim() ||
        "http://127.0.0.1:3001/eddeliapi/subscription/entitlement",
      secret:
        process.env.EDDELI_ENTITLEMENT_SECRET?.trim() ||
        "gc_4a177c0295a4cb88d52cea1035b9e9a5",
    },
    {
      names: ["Store", "store", "STORE"],
      url:
        process.env.STORE_ENTITLEMENT_URL?.trim() ||
        "http://127.0.0.1:3003/storeapi/subscription/entitlement",
      secret:
        process.env.STORE_ENTITLEMENT_SECRET?.trim() ||
        "gc_46ba297fd7a64b1dde02252adc16d936",
    },
    {
      names: ["Tienda", "tienda", "TIENDA"],
      url:
        process.env.TIENDA_ENTITLEMENT_URL?.trim() ||
        "http://127.0.0.1:3004/tiendaapi/subscription/entitlement",
      secret:
        process.env.TIENDA_ENTITLEMENT_SECRET?.trim() ||
        "gc_7c3e91a2b8f04d55e6a1c09d4f2b87e0",
    },
  ];

  const updated: string[] = [];
  const pushed: string[] = [];
  const warnings: string[] = [];

  for (const target of targets) {
    const app = await prisma.apps.findFirst({
      where: { deleted_at: null, name: { in: target.names } },
      select: { id: true, hash: true, name: true },
    });
    if (!app) {
      warnings.push(`No encontré app (${target.names[0]}) para realinear`);
      continue;
    }
    if (!target.secret) {
      warnings.push(`${app.name}: sin secreto local en .env`);
      continue;
    }

    await prisma.apps.update({
      where: { id: app.id },
      data: {
        entitlement_url: target.url,
        entitlement_secret: sealSecret(target.secret),
      },
    });
    updated.push(app.name || target.names[0]);

    try {
      const push = await pushEntitlementToApp(app.hash);
      if (push.ok && !push.skipped) pushed.push(app.name || target.names[0]);
      else if (!push.ok) {
        warnings.push(
          `${app.name}: push falló (${push.error || "sin detalle"})`,
        );
      }
    } catch (err) {
      warnings.push(
        `${app.name}: push error (${err instanceof Error ? err.message : err})`,
      );
    }
  }

  if (updated.length) {
    console.log(
      `[backups] Entitlements locales realineados: ${updated.join(", ")}`,
    );
  }
  if (warnings.length) {
    console.warn("[backups] realign warnings:", warnings.join(" | "));
  }

  return { updated, pushed, warnings };
}
