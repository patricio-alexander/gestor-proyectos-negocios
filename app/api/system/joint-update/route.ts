import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import {
  announceScheduledUpdate,
  executeJointUpdate,
  normalizeTargets,
  packJobTargets,
  runDueJointJobs,
  type DeploySteps,
  type JointPolicy,
  type TrioId,
} from "@/src/features/system/lib/joint-update";
import { clearPendingScheduledByJobId } from "@/src/features/system/lib/pending-scheduled-update";
import { matchTrioId } from "@/src/features/system/lib/trio-apps";
import { pushEntitlementToApp } from "@/src/shared/lib/push-entitlement";
import { guayaquilWallTimeToUtc } from "@/src/features/system/lib/guayaquil-time";
import { PRODUCTION_SITE_URL } from "@/src/config/site";

/** ISO con Z/offset → Date; datetime-local sin zona → Guayaquil. */
function parseRunAt(raw: string): Date {
  const s = String(raw || "").trim();
  if (!s) return new Date(NaN);
  if (/Z$/i.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) {
    return new Date(s);
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    return guayaquilWallTimeToUtc(s);
  }
  return new Date(s);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** GET → jobs pendientes + dispara los vencidos. */
export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const ran = await runDueJointJobs();
  const pending = await prisma.jointUpdateJob.findMany({
    where: { status: { in: ["pending", "running"] } },
    orderBy: { run_at: "asc" },
    take: 20,
  });
  const recent = await prisma.jointUpdateJob.findMany({
    where: { status: { in: ["done", "failed", "cancelled"] } },
    orderBy: { finished_at: "desc" },
    take: 10,
  });

  return NextResponse.json({
    ok: true,
    ranDue: ran,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
    pending,
    recent,
  });
}

/**
 * POST → actualizar ahora o programar.
 * body: {
 *   when: "now" | "schedule",
 *   runAt?: ISO,
 *   policy: "forced" | "optional",
 *   deploy?: boolean,
 *   notify?: boolean,
 *   targets?: string[],
 *   cancelJobId?: number
 * }
 */
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  let body: {
    when?: "now" | "schedule";
    runAt?: string;
    policy?: JointPolicy;
    deploy?: boolean;
    notify?: boolean;
    targets?: TrioId[];
    steps?: DeploySteps;
    forceLogout?: boolean;
    cancelJobId?: number;
    rescheduleJobId?: number;
  } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.cancelJobId) {
    const jobId = Number(body.cancelJobId);
    await prisma.jointUpdateJob.update({
      where: { id: jobId },
      data: { status: "cancelled", finished_at: new Date() },
    });
    clearPendingScheduledByJobId(jobId);
    // Empujar entitlement limpio (sin countdown) a las apps del trío
    const apps = await prisma.apps.findMany({
      where: { deleted_at: null, kind: { not: "mobile" } },
      select: { hash: true, name: true, path: true, entitlement_url: true },
    });
    for (const app of apps) {
      if (!matchTrioId(app)) continue;
      await pushEntitlementToApp(app.hash);
    }
    return NextResponse.json({ ok: true, cancelled: jobId });
  }

  if (body.rescheduleJobId) {
    if (!body.runAt) {
      return NextResponse.json(
        { error: "Para reprogramar indicá runAt" },
        { status: 400 },
      );
    }
    const jobId = Number(body.rescheduleJobId);
    const runAt = parseRunAt(body.runAt);
    if (Number.isNaN(runAt.getTime()) || runAt.getTime() < Date.now() - 60_000) {
      return NextResponse.json(
        { error: "runAt inválida o en el pasado (hora Ecuador / Guayaquil)" },
        { status: 400 },
      );
    }
    const existing = await prisma.jointUpdateJob.findFirst({
      where: { id: jobId, status: "pending" },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Job no encontrado o ya no está pendiente" },
        { status: 404 },
      );
    }
    const job = await prisma.jointUpdateJob.update({
      where: { id: jobId },
      data: { run_at: runAt },
    });
    const targets = normalizeTargets(existing.targets);
    const forceLogout = Boolean(
      existing.targets &&
        typeof existing.targets === "object" &&
        !Array.isArray(existing.targets) &&
        (existing.targets as { forceLogout?: boolean }).forceLogout,
    );
    // Reavisar apps con la nueva hora (countdown)
    const announced = await announceScheduledUpdate({
      targets,
      runAt,
      policy: existing.policy === "optional" ? "optional" : "forced",
      forceLogout,
      jobId: job.id,
    });
    return NextResponse.json({
      ok: true,
      rescheduled: true,
      job,
      announced,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
    });
  }

  const policy: JointPolicy =
    body.policy === "optional" ? "optional" : "forced";
  const deploy = body.deploy !== false;
  const notify = body.notify !== false;
  const forceLogout = Boolean(body.forceLogout);
  const targets = normalizeTargets(body.targets);
  const steps: DeploySteps = {
    git: body.steps?.git !== false,
    sync: body.steps?.sync !== false,
    pm2: body.steps?.pm2 !== false,
  };
  const when = body.when === "schedule" ? "schedule" : "now";

  if (when === "schedule") {
    if (!body.runAt) {
      return NextResponse.json(
        { error: "Para programar indicá runAt (ISO)" },
        { status: 400 },
      );
    }
    const runAt = parseRunAt(body.runAt);
    if (Number.isNaN(runAt.getTime()) || runAt.getTime() < Date.now() - 60_000) {
      return NextResponse.json(
        { error: "runAt inválida o en el pasado (usar hora Ecuador / Guayaquil)" },
        { status: 400 },
      );
    }
    const job = await prisma.jointUpdateJob.create({
      data: {
        run_at: runAt,
        policy,
        deploy,
        notify,
        targets: packJobTargets(targets, steps, forceLogout),
        status: "pending",
      },
    });

    let announced: Awaited<ReturnType<typeof announceScheduledUpdate>> | null =
      null;
    if (notify) {
      announced = await announceScheduledUpdate({
        targets,
        runAt,
        policy,
        forceLogout,
        jobId: job.id,
      });
    }

    return NextResponse.json({
      ok: true,
      scheduled: true,
      job,
      announced,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
    });
  }

  const result = await executeJointUpdate({
    policy,
    deploy,
    notify,
    targets,
    steps,
    forceLogout,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
