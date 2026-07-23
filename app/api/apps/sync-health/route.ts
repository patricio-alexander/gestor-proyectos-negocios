import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import {
  probeEntitlementUrl,
  type AppSyncHealthRow,
} from "@/src/features/apps/lib/probe-entitlement";

/**
 * GET — comprueba comunicación real con cada backend (entitlement_url).
 * No confía solo en tener URL/secreto configurados.
 */
export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const apps = await prisma.apps.findMany({
      where: { deleted_at: null, kind: { not: "mobile" } },
      select: {
        id: true,
        entitlement_url: true,
        entitlement_secret: true,
      },
    });

    const results = await Promise.all(
      apps.map(async (app): Promise<AppSyncHealthRow> => {
        const url = app.entitlement_url?.trim() || "";
        if (!url) {
          return {
            app_id: app.id,
            state: "not_configured",
            latency_ms: null,
            http_status: null,
            error: null,
          };
        }
        if (!app.entitlement_secret?.trim()) {
          return {
            app_id: app.id,
            state: "no_secret",
            latency_ms: null,
            http_status: null,
            error: null,
          };
        }

        const probe = await probeEntitlementUrl(url, app.entitlement_secret);
        return {
          app_id: app.id,
          state: probe.online ? "online" : "offline",
          latency_ms: probe.latencyMs,
          http_status: probe.status ?? null,
          error: probe.error ?? null,
        };
      }),
    );

    return NextResponse.json({
      checked_at: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error("[apps/sync-health]", err);
    return NextResponse.json(
      { error: "No se pudo comprobar el estado de sync" },
      { status: 500 },
    );
  }
}
