import { spawn } from "node:child_process";
import path from "node:path";
import { prisma } from "@/src/shared/lib/prisma";
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

export function normalizeTargets(raw: unknown): TrioId[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...TRIO_IDS];
  const out = raw
    .map((x) => String(x).toLowerCase())
    .filter((x): x is TrioId => TRIO_IDS.includes(x as TrioId));
  return out.length ? out : [...TRIO_IDS];
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
}): Promise<JointRunResult> {
  const targets = normalizeTargets(opts.targets);
  const force = opts.policy === "forced";
  const notified: JointRunResult["notified"] = [];
  let deployResult: unknown = null;

  if (opts.notify) {
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
        data: {
          updating: true,
          update_force: force,
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

  if (opts.deploy) {
    // Actualizar cada target (force pull)
    const results = [];
    for (const id of targets) {
      const r = await runUpdateScript([
        `--mode=one`,
        `--app=${id}`,
        `--force`,
        `--live`,
      ]);
      results.push({ id, ...(typeof r.json === "object" && r.json ? r.json : { ok: r.code === 0, raw: r.stdout, stderr: r.stderr }) });
    }
    deployResult = { results };
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
