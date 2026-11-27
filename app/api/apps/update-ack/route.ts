import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { validateKey } from "@/src/shared/lib/api-auth";
import { ensureAppsUpdateColumns } from "@/src/shared/lib/ensure-apps-update-columns";
import { pushEntitlementToApp } from "@/src/shared/lib/push-entitlement";
import { acknowledgeEarlyAppUpdate } from "@/src/features/system/lib/joint-update";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * La app avisa que el usuario terminó la actualización.
 * Auth: Authorization: Bearer <entitlement_secret>
 * Body: { version?: "1.0.0.12" }
 *
 * Efecto: limpia schedule/job pendiente, apaga updating/aviso y empuja entitlement.
 */
export async function POST(request: NextRequest) {
  const auth = await validateKey(request);
  if (auth.error) return auth.error;

  let body: { version?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const version = String(body.version || "")
    .trim()
    .slice(0, 40);

  await ensureAppsUpdateColumns();

  // Primero: quitar countdown / job (antes del push de entitlement)
  const early = await acknowledgeEarlyAppUpdate(auth.app_id);

  const app = await prisma.apps.update({
    where: { id: auth.app_id },
    data: {
      updating: false,
      update_available: false,
      update_force: true,
      update_force_logout: false,
      ...(version ? { reported_version: version } : {}),
    },
    select: {
      id: true,
      name: true,
      hash: true,
      updating: true,
      update_available: true,
      reported_version: true,
    },
  });

  // Push con schedule ya limpio → icono rojo se apaga
  const push = await pushEntitlementToApp(app.hash);

  console.log(
    `[update-ack] app=${app.name || app.id} version=${app.reported_version || "—"} early=${early.jobsTouched} push_ok=${push.ok}`,
  );

  return NextResponse.json({
    ok: true,
    app: {
      id: app.id,
      name: app.name,
      reported_version: app.reported_version,
      updating: false,
      update_available: false,
      update_scheduled_at: null,
    },
    early,
    push_ok: Boolean(push.ok),
  });
}
