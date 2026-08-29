import { prisma } from "@/src/shared/lib/prisma";
import { buildEntitlementForAppHash } from "./entitlement-payload";
import {
  formatPushError,
  type PushEntitlementOutcome,
} from "./push-entitlement-shared";
import { revealSecret } from "./secret-crypto";
import { parseEntitlementRoute } from "@/src/features/apps/lib/sync-diagnostics";

export type {
  PushAppResult,
  PushEntitlementOutcome,
  PushResponseFields,
} from "./push-entitlement-shared";

export {
  formatPushError,
  summarizePushResults,
  toBatchPushResponseFields,
  toPushResponseFields,
} from "./push-entitlement-shared";

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

  const appName = app?.name?.trim() || appHash.slice(0, 8);
  const routeInfo = app?.entitlement_url
    ? parseEntitlementRoute(app.entitlement_url)
    : null;

  if (!app?.entitlement_url) {
    return {
      ok: true,
      skipped: true,
      app_name: appName,
      route: routeInfo?.pushRoute,
      module: routeInfo?.module,
    };
  }

  const payload = await buildEntitlementForAppHash(appHash);
  const secret = revealSecret(app.entitlement_secret) || "";

  try {
    const res = await fetch(app.entitlement_url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const friendly = formatPushError(text || res.statusText, res.status);
      console.error(
        `[entitlement] push falló (${appName}): ${res.status} ${friendly}`,
      );
      return {
        ok: false,
        status: res.status,
        error: friendly,
        app_name: appName,
        route: routeInfo?.pushRoute,
        module: routeInfo?.module,
      };
    }

    console.log(`[entitlement] push OK → ${appName} (${app.entitlement_url})`);
    return {
      ok: true,
      app_name: appName,
      route: routeInfo?.pushRoute,
      module: routeInfo?.module,
    };
  } catch (err) {
    const message = formatPushError(
      err instanceof Error ? err.message : String(err),
    );
    console.error(`[entitlement] push error (${appName}):`, message);
    return {
      ok: false,
      error: message,
      app_name: appName,
      route: routeInfo?.pushRoute,
      module: routeInfo?.module,
    };
  }
}
