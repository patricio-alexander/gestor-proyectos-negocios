import { prisma } from "@/src/shared/lib/prisma";
import { buildEntitlementForAppHash } from "./entitlement-payload";

export type PushEntitlementOutcome = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  status?: number;
};

/** Campos listos para incluir en JSON de respuesta de API. */
export function toPushResponseFields(result: PushEntitlementOutcome) {
  return {
    push_ok: Boolean(result.ok && !result.skipped),
    push_skipped: Boolean(result.skipped),
    push_error: result.error ?? null,
  };
}

/**
 * Empuja el entitlement al backend de la app (si tiene entitlement_url configurada).
 * No lanza: loguea y sigue (el gestor no debe fallar si la app está offline).
 */
export async function pushEntitlementToApp(
  appHash: string,
): Promise<PushEntitlementOutcome> {
  const app = await prisma.apps.findFirst({
    where: { hash: appHash, deleted_at: null },
    select: {
      name: true,
      entitlement_url: true,
      entitlement_secret: true,
    },
  });

  if (!app?.entitlement_url) {
    return { ok: true, skipped: true };
  }

  const payload = await buildEntitlementForAppHash(appHash);
  const secret = app.entitlement_secret || "";

  try {
    const res = await fetch(app.entitlement_url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[entitlement] push falló (${app.name}): ${res.status} ${text}`,
      );
      return { ok: false, status: res.status, error: text || res.statusText };
    }

    console.log(`[entitlement] push OK → ${app.name} (${app.entitlement_url})`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[entitlement] push error (${app.name}):`, message);
    return { ok: false, error: message };
  }
}
