import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { revealSecret } from "@/src/shared/lib/secret-crypto";
import {
  probeAppSyncHealth,
  type AppSyncHealthRow,
} from "@/src/features/apps/lib/probe-entitlement";

/**
 * GET — diagnóstico de sync: backend, auth gestor↔app y estado de suscripción.
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
        const secret = revealSecret(app.entitlement_secret)?.trim() || "";
        return probeAppSyncHealth(app.id, url, secret);
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
