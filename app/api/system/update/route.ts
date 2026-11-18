import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { PRODUCTION_SITE_URL } from "@/src/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const GESTOR_ROOT = path.resolve(process.cwd());
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

/** GET → estado de repos. */
export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const result = await runUpdate(["--mode=status"]);
  if (!result.json) {
    return NextResponse.json(
      {
        error: "No se pudo leer el estado de actualización",
        detail: result.stderr || result.stdout,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
      },
      { status: 500 },
    );
  }
  return NextResponse.json(result.json);
}

/**
 * POST → actualizar apps en el servidor (git pull + db:sync + pm2).
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

  if (body.dryRun === true || process.env.UPDATE_APPS_DRY_RUN === "1") {
    args.push("--dry-run");
  } else {
    args.push("--live");
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
