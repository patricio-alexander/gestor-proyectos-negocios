import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { validateKey } from "@/src/shared/lib/api-auth";
import {
  acknowledgeEarlyAppUpdate,
  deployTrioApp,
  extractSteps,
  matchTrioId,
} from "@/src/features/system/lib/joint-update";
import {
  peekPendingOptionalDeploy,
  takePendingOptionalDeploy,
  savePendingOptionalDeploy,
} from "@/src/features/system/lib/pending-optional-deploy";
import { peekPendingScheduledUpdate } from "@/src/features/system/lib/pending-scheduled-update";
import { pushEntitlementToApp } from "@/src/shared/lib/push-entitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Usuario pulsó «Actualizar ahora» (opcional diferido o programada anticipada).
 * Auth: Bearer <entitlement_secret>
 * - Corre deploy pendiente si hay
 * - Cancela/limpia la programada para esta app (icono deja de estar rojo tras push)
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
      hash: true,
    },
  });
  if (!app) {
    return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
  }

  const trio = matchTrioId(app);
  const scheduled = peekPendingScheduledUpdate(app.id);
  let pending = peekPendingOptionalDeploy(app.id);

  // Si hay programada con deploy y no hay optional pending, usar pasos del job
  let deployFromSchedule = false;
  let scheduleSteps = { git: true, sync: true, pm2: true };
  if (!pending && scheduled?.jobId && trio) {
    const job = await prisma.jointUpdateJob.findFirst({
      where: { id: scheduled.jobId, status: { in: ["pending", "running"] } },
    });
    if (job?.deploy) {
      deployFromSchedule = true;
      const steps = extractSteps(job.targets);
      scheduleSteps = {
        git: steps?.git !== false,
        sync: steps?.sync !== false,
        pm2: steps?.pm2 !== false,
      };
    }
  }

  let deployResult: unknown = null;
  let deployed = false;

  if (pending) {
    pending = takePendingOptionalDeploy(app.id) || pending;
    try {
      const { ok, result } = await deployTrioApp(pending.trio, pending.steps);
      deployResult = result;
      deployed = true;
      if (!ok) {
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
  } else if (deployFromSchedule && trio) {
    try {
      const { ok, result } = await deployTrioApp(trio, scheduleSteps);
      deployResult = result;
      deployed = true;
      if (!ok) {
        return NextResponse.json(
          {
            ok: false,
            error: "Falló el deploy de la actualización programada",
            trio,
            result,
          },
          { status: 500 },
        );
      }
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        },
        { status: 500 },
      );
    }
  }

  // Limpiar schedule/job de esta app y empujar entitlement sin countdown
  const early = await acknowledgeEarlyAppUpdate(app.id);
  const push = await pushEntitlementToApp(app.hash);

  console.log(
    `[update-apply] app=${app.name || app.id} trio=${trio || "—"} deployed=${deployed} early_jobs=${early.jobsTouched} push_ok=${push.ok}`,
  );

  return NextResponse.json({
    ok: true,
    trio,
    deployed,
    skipped: !deployed,
    reason: deployed ? undefined : "no_pending_deploy",
    early,
    result: deployResult,
    push_ok: Boolean(push.ok),
  });
}
