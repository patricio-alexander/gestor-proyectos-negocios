import { spawn } from "node:child_process";
import path from "node:path";
import { prisma } from "@/src/shared/lib/prisma";
import { ensureAppsUpdateColumns } from "@/src/shared/lib/ensure-apps-update-columns";
import { pushEntitlementToApp } from "@/src/shared/lib/push-entitlement";
import { PRODUCTION_SITE_URL } from "@/src/config/site";
import {
  matchTrioId,
  TRIO_IDS,
  type TrioId,
} from "@/src/features/system/lib/trio-apps";

export type { TrioId };
export type JointPolicy = "forced" | "optional";
export { matchTrioId };

export type DeploySteps = {
  git?: boolean;
  sync?: boolean;
  pm2?: boolean;
};

/** targets puede ser `["eddeli"]` o `{ apps: [...], steps?: {...} }` (jobs). */
export function normalizeTargets(raw: unknown): TrioId[] {
  const list = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === "object" &&
        Array.isArray((raw as { apps?: unknown }).apps)
      ? (raw as { apps: unknown[] }).apps
      : null;
  if (!list || list.length === 0) return [...TRIO_IDS];
  const out = list
    .map((x) => String(x).toLowerCase())
    .filter((x): x is TrioId => TRIO_IDS.includes(x as TrioId));
  return out.length ? out : [...TRIO_IDS];
}

export function extractSteps(raw: unknown): DeploySteps | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const steps = (raw as { steps?: DeploySteps }).steps;
  if (!steps || typeof steps !== "object") return undefined;
  return steps;
}

export function packJobTargets(
  targets: TrioId[],
  steps?: DeploySteps,
  forceLogout?: boolean,
): { apps: TrioId[]; steps: DeploySteps; forceLogout: boolean } {
  return {
    apps: targets,
    steps: {
      git: steps?.git !== false,
      sync: steps?.sync !== false,
      pm2: steps?.pm2 !== false,
    },
    forceLogout: Boolean(forceLogout),
  };
}

export function extractForceLogout(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  return Boolean((raw as { forceLogout?: boolean }).forceLogout);
}

function runUpdateScript(args: string[]): Promise<{
  code: number;
  stdout: string;
  stderr: string;
  json: unknown;
}> {
  const root = path.resolve(process.cwd());
  const script = path.join(root, "scripts", "update-apps.mjs");
  return new Promise((resolve) => {
    console.log(`[joint-update] exec: node ${script} ${args.join(" ")}`);
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => {
      stdout += String(c);
    });
    child.stderr.on("data", (c) => {
      const t = String(c);
      stderr += t;
      process.stderr.write(t);
    });
    child.on("close", (code) => {
      let json: unknown = null;
      try {
        json = JSON.parse(stdout);
      } catch {
        json = null;
      }
      resolve({ code: code ?? 1, stdout, stderr, json });
    });
    child.on("error", (err) => {
      resolve({
        code: 1,
        stdout,
        stderr: `${stderr}\n${err.message}`,
        json: null,
      });
    });
  });
}

export type JointRunResult = {
  ok: boolean;
  policy: JointPolicy;
  deploy: boolean;
  notify: boolean;
  targets: TrioId[];
  notified: { id: number; name: string | null; trio: TrioId; push_ok: boolean }[];
  deployResult: unknown;
  siteUrl: string;
  error?: string;
};

/** Ejecuta notificación (updating) y/o deploy de código. */
export async function executeJointUpdate(opts: {
  policy: JointPolicy;
  deploy: boolean;
  notify: boolean;
  targets: TrioId[];
  steps?: DeploySteps;
  /** Si true, la app Vite cierra sesión al Continuar. */
  forceLogout?: boolean;
}): Promise<JointRunResult> {
  const targets = normalizeTargets(opts.targets);
  const force = opts.policy === "forced";
  const forceLogout = Boolean(opts.forceLogout);
  const notified: JointRunResult["notified"] = [];
  let deployResult: unknown = null;
  const steps = {
    git: opts.steps?.git !== false,
    sync: opts.steps?.sync !== false,
    pm2: opts.steps?.pm2 !== false,
  };

  if (opts.notify) {
    await ensureAppsUpdateColumns();
    const apps = await prisma.apps.findMany({
      where: { deleted_at: null, kind: { not: "mobile" } },
      select: {
        id: true,
        hash: true,
        name: true,
        path: true,
        entitlement_url: true,
      },
    });

    for (const app of apps) {
      const trio = matchTrioId(app);
      if (!trio || !targets.includes(trio)) continue;

      await prisma.apps.update({
        where: { id: app.id },
        data: force
          ? {
              // Forzada: bloquea con pantalla de progreso
              updating: true,
              update_force: true,
              update_available: false,
              update_force_logout: forceLogout,
              maintenance: false,
            }
          : {
              // Con aceptación: modal (NO bloquear con «Sistema actualizándose»)
              updating: false,
              update_force: false,
              update_available: true,
              update_force_logout: forceLogout,
              maintenance: false,
            },
      });

      const push = await pushEntitlementToApp(app.hash);
      notified.push({
        id: app.id,
        name: app.name,
        trio,
        push_ok: Boolean(push.ok),
      });
    }
  }

  if (opts.deploy && (steps.git || steps.sync || steps.pm2)) {
    const stepParts = [
      steps.git ? "git" : null,
      steps.sync ? "sync" : null,
      steps.pm2 ? "pm2" : null,
    ].filter(Boolean);
    const results = [];
    for (const id of targets) {
      const args = [
        `--mode=one`,
        `--app=${id}`,
        `--force`,
        `--live`,
        `--steps=${stepParts.join(",")}`,
      ];
      const r = await runUpdateScript(args);
      results.push({
        id,
        ...(typeof r.json === "object" && r.json
          ? r.json
          : { ok: r.code === 0, raw: r.stdout, stderr: r.stderr }),
      });
    }
    deployResult = { results, steps };
  }

  const notifyFailed = notified.some((n) => !n.push_ok);
  const deployFailed =
    opts.deploy &&
    Array.isArray((deployResult as { results?: { ok?: boolean }[] })?.results) &&
    (deployResult as { results: { ok?: boolean }[] }).results.some((r) => r.ok === false);

  return {
    ok: !notifyFailed && !deployFailed,
    policy: opts.policy,
    deploy: opts.deploy,
    notify: opts.notify,
    targets,
    notified,
    deployResult,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
    error: notifyFailed
      ? "Algunas apps no recibieron el push de entitlement"
      : deployFailed
        ? "Falló el deploy de alguna app"
        : undefined,
  };
}

/** Corre jobs pendientes cuya hora ya pasó. */
export async function runDueJointJobs(): Promise<number> {
  const due = await prisma.jointUpdateJob.findMany({
    where: { status: "pending", run_at: { lte: new Date() } },
    orderBy: { run_at: "asc" },
    take: 5,
  });

  let ran = 0;
  for (const job of due) {
    await prisma.jointUpdateJob.update({
      where: { id: job.id },
      data: { status: "running", started_at: new Date() },
    });
    try {
      const result = await executeJointUpdate({
        policy: job.policy === "optional" ? "optional" : "forced",
        deploy: Boolean(job.deploy),
        notify: Boolean(job.notify),
        targets: normalizeTargets(job.targets),
        steps: extractSteps(job.targets),
        forceLogout: extractForceLogout(job.targets),
      });
      await prisma.jointUpdateJob.update({
        where: { id: job.id },
        data: {
          status: result.ok ? "done" : "failed",
          result: result as object,
          error: result.error || null,
          finished_at: new Date(),
        },
      });
      ran += 1;
    } catch (e) {
      await prisma.jointUpdateJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          error: e instanceof Error ? e.message : String(e),
          finished_at: new Date(),
        },
      });
      ran += 1;
    }
  }
  return ran;
}
