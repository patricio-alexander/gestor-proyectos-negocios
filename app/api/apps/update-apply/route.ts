import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { validateKey } from "@/src/shared/lib/api-auth";
import { deployTrioApp } from "@/src/features/system/lib/joint-update";
import {
  peekPendingOptionalDeploy,
  takePendingOptionalDeploy,
  savePendingOptionalDeploy,
} from "@/src/features/system/lib/pending-optional-deploy";
import { matchTrioId } from "@/src/features/system/lib/trio-apps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * La app avisa que el usuario aceptó «Actualizar ahora» (política optional).
 * Auth: Bearer <entitlement_secret>
 * Corre el deploy pendiente (git/sync/pm2) diferido al enviar el aviso.
 */
export async function POST(request: NextRequest) {
  const auth = await validateKey(request);
  if (auth.error) return auth.error;

  const app = await prisma.apps.findFirst({
    where: { id: auth.app_id, deleted_at: null },
    select: {
      id: true,
      name: true,
      path: true,
      entitlement_url: true,
    },
  });
  if (!app) {
    return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
  }

  let pending = peekPendingOptionalDeploy(app.id);
  if (!pending) {
    const trio = matchTrioId(app);
    if (!trio) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "no_pending_deploy",
      });
    }
    // Sin pendiente explícito: no inventar deploy (aviso pudo ser solo notify).
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "no_pending_deploy",
      trio,
    });
  }

  // Reservar el pendiente para no lanzar dos deploys en paralelo
  pending = takePendingOptionalDeploy(app.id) || pending;

  try {
    const { ok, result } = await deployTrioApp(pending.trio, pending.steps);
    if (!ok) {
      // Reponer para reintento si el usuario reabre el flujo
      savePendingOptionalDeploy(pending);
      return NextResponse.json(
        {
          ok: false,
          error: "Falló el deploy diferido",
          trio: pending.trio,
          result,
        },
        { status: 500 },
      );
    }
    console.log(
      `[update-apply] app=${app.name || app.id} trio=${pending.trio} deploy_ok`,
    );
    return NextResponse.json({
      ok: true,
      trio: pending.trio,
      result,
    });
  } catch (e) {
    savePendingOptionalDeploy(pending);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
