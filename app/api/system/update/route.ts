import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { PRODUCTION_SITE_URL } from "@/src/config/site";
import {
  gestorSelfUpdateLogPath,
  readGestorSelfUpdateState,
  writeGestorSelfUpdateState,
} from "@/src/features/system/lib/gestor-self-update-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Trio apps aún esperan el script; el self-update del gestor responde 202 al toque. */
export const maxDuration = 300;

const GESTOR_ROOT = path.resolve(/* turbopackIgnore: true */ process.cwd());
const SCRIPT = path.join(GESTOR_ROOT, "scripts", "update-apps.mjs");

type Mode = "status" | "all" | "missing" | "one";

function runUpdate(args: string[]): Promise<{
  code: number;
  stdout: string;
  stderr: string;
  json: unknown;
}> {
  return new Promise((resolve) => {
    console.log(`[system/update] exec: node ${SCRIPT} ${args.join(" ")}`);
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      cwd: GESTOR_ROOT,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      const text = String(chunk);
      stderr += text;
      process.stderr.write(text);
    });
    child.on("error", (err) => {
      console.error("[system/update] spawn error:", err);
      resolve({
        code: 1,
        stdout,
        stderr: `${stderr}\n${err.message}`,
        json: null,
      });
    });
    child.on("close", (code) => {
      console.log(`[system/update] exit code=${code ?? 1}`);
      let json: unknown = null;
      try {
        json = JSON.parse(stdout);
      } catch {
        json = null;
      }
      resolve({ code: code ?? 1, stdout, stderr, json });
    });
  });
}

function isGestorSelfUpdate(mode: Mode, app?: string): boolean {
  return mode === "one" && String(app || "").toLowerCase() === "gestor";
}

/** Lanza update-apps en proceso independiente (no espera build/restart). */
function spawnGestorSelfUpdateDetached(args: string[]): {
  pid: number | null;
  logFile: string;
} {
  const logFile = gestorSelfUpdateLogPath();
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const out = fs.openSync(logFile, "a");
  fs.writeSync(
    out,
    `\n---- gestor self-update ${new Date().toISOString()} ----\n`,
  );

  const child = spawn(process.execPath, [SCRIPT, ...args], {
    cwd: GESTOR_ROOT,
    env: {
      ...process.env,
      GESTOR_SELF_UPDATE: "1",
    },
    detached: true,
    stdio: ["ignore", out, out],
  });
  child.unref();
  return { pid: child.pid ?? null, logFile };
}

/** GET → estado de repos + selfUpdate del gestor si hay. */
export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const selfUpdate = readGestorSelfUpdateState();
  const result = await runUpdate(["--mode=status"]);
  if (!result.json) {
    return NextResponse.json(
      {
        error: "No se pudo leer el estado de actualización",
        detail: result.stderr || result.stdout,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
        selfUpdate,
      },
      { status: 500 },
    );
  }
  return NextResponse.json({
    ...(result.json as object),
    selfUpdate,
  });
}

/**
 * POST → actualizar apps en el servidor (git pull + db:sync + pm2).
 * Self-update del gestor (mode=one, app=gestor): 202 + proceso detached.
 * Por defecto es REAL. Solo simula si UPDATE_APPS_DRY_RUN=1 o body.dryRun=true.
 */
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  let body: { mode?: Mode; app?: string; force?: boolean; dryRun?: boolean } =
    {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const mode = (body.mode || "all") as Mode;
  if (!["all", "missing", "one", "status"].includes(mode)) {
    return NextResponse.json({ error: "mode inválido" }, { status: 400 });
  }

  const args = [`--mode=${mode}`];
  if (mode === "one") {
    if (!body.app) {
      return NextResponse.json(
        {
          error:
            "Para mode=one indica app (eddeli|store|tienda|raptor|gestor)",
        },
        { status: 400 },
      );
    }
    args.push(`--app=${body.app}`);
  }
  if (body.force || mode === "all" || mode === "one") args.push("--force");

  const dryRun =
    body.dryRun === true || process.env.UPDATE_APPS_DRY_RUN === "1";
  if (dryRun) {
    args.push("--dry-run");
  } else {
    args.push("--live");
  }

  // Self-update: no bloquear el next start que se va a reiniciar.
  if (isGestorSelfUpdate(mode, body.app)) {
    const prev = readGestorSelfUpdateState();
    if (prev.status === "updating") {
      return NextResponse.json(
        {
          ok: true,
          accepted: true,
          status: "updating",
          message: "Ya hay una autoactualización en curso",
          selfUpdate: prev,
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
        },
        { status: 202 },
      );
    }

    writeGestorSelfUpdateState({
      status: "updating",
      acceptedAt: new Date().toISOString(),
      headBefore: prev.headAfter ?? null,
      headAfter: null,
      log: ["Aceptado: proceso detached iniciado"],
      error: null,
      pid: null,
      dryRun,
    });

    try {
      const { pid, logFile } = spawnGestorSelfUpdateDetached(args);
      writeGestorSelfUpdateState({
        status: "updating",
        acceptedAt: new Date().toISOString(),
        headBefore: prev.headAfter ?? null,
        headAfter: null,
        log: [
          "Aceptado: proceso detached iniciado",
          pid != null ? `pid=${pid}` : "pid=?",
          `log=${logFile}`,
        ],
        error: null,
        pid,
        dryRun,
      });
      return NextResponse.json(
        {
          ok: true,
          accepted: true,
          status: "updating",
          pid,
          message:
            "Actualización del gestor aceptada. El servidor se reiniciará al terminar el build.",
          selfUpdate: readGestorSelfUpdateState(),
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
        },
        { status: 202 },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo lanzar el update";
      writeGestorSelfUpdateState({
        status: "error",
        acceptedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        error: msg,
        log: [msg],
        dryRun,
      });
      return NextResponse.json(
        { ok: false, error: msg, status: "error" },
        { status: 500 },
      );
    }
  }

  const result = await runUpdate(args);
  const payload =
    result.json ||
    ({
      ok: false,
      error: "El script no devolvió JSON",
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
    } as const);

  return NextResponse.json(payload, {
    status: result.code === 0 || (payload as { ok?: boolean }).ok ? 200 : 500,
  });
}
