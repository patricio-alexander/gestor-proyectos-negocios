#!/usr/bin/env node
/**
 * Actualiza apps del hub en el servidor (git pull → db:sync → pm2 restart).
 *
 * Flujo producción:
 *   1) Subís cambios a git desde tu máquina
 *   2) En https://aplicaciones.marianosamaniego.edu.ec/raptorsolutions
 *      → Configuración → Actualizar → "Actualizar las 3"
 *
 * Uso CLI:
 *   node scripts/update-apps.mjs --mode=all
 *   node scripts/update-apps.mjs --mode=missing
 *   node scripts/update-apps.mjs --mode=one --app=eddeli
 *   node scripts/update-apps.mjs --mode=status
 *   node scripts/update-apps.mjs --mode=all --dry-run   # solo simula
 *
 * Env:
 *   UPDATE_APPS_DRY_RUN=1  → simula (no pull)
 *   UPDATE_APPS_LIVE=1     → fuerza real
 *   APPSWEB_ROOT           → carpeta AppsWeb (default: padre del gestor)
 *   PM2_EDDELI / PM2_STORE / PM2_TIENDA / PM2_APP
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GESTOR_ROOT = path.resolve(__dirname, "..");
const APPSWEB = path.resolve(
  process.env.APPSWEB_ROOT || path.join(GESTOR_ROOT, ".."),
);
const SYSTEM_VERSION = "0.0.1.0";
const PRODUCTION_SITE_URL =
  "https://aplicaciones.marianosamaniego.edu.ec/raptorsolutions";

const APPS = {
  eddeli: {
    id: "eddeli",
    title: "EdDeli",
    root: path.join(APPSWEB, "eddeli"),
    backend: path.join(APPSWEB, "eddeli", "backend"),
    pm2: process.env.PM2_EDDELI || "backendEddeli",
    sync: true,
  },
  store: {
    id: "store",
    title: "Store",
    root: path.join(APPSWEB, "store"),
    backend: path.join(APPSWEB, "store", "backend"),
    pm2: process.env.PM2_STORE || "backendStore",
    sync: true,
  },
  tienda: {
    id: "tienda",
    title: "Tienda",
    root: path.join(APPSWEB, "tienda"),
    backend: path.join(APPSWEB, "tienda", "backend"),
    pm2: process.env.PM2_TIENDA || "backendTienda",
    sync: true,
  },
  raptor: {
    id: "raptor",
    title: "Raptor (front)",
    root: path.join(APPSWEB, "raptor"),
    backend: null,
    pm2: null,
    sync: false,
  },
  gestor: {
    id: "gestor",
    title: "Raptor Solutions (gestor)",
    root: GESTOR_ROOT,
    backend: null,
    pm2: process.env.PM2_APP || "Raptor Solutions",
    sync: false,
    /** Next.js: rebuild antes de reiniciar PM2. */
    build: true,
  },
};

const TRIO = ["eddeli", "store", "tienda"];

/** Staging build del gestor: no pisa el .next que sirve next start. */
const GESTOR_STAGING_DIR = ".next-staging";
const GESTOR_PREV_DIR = ".next-prev";
const SELF_UPDATE_STATUS = path.join(
  GESTOR_ROOT,
  "data",
  "gestor-self-update.json",
);

function say(msg) {
  process.stderr.write(`[update-apps] ${msg}\n`);
}

function writeSelfUpdateState(patch) {
  try {
    fs.mkdirSync(path.dirname(SELF_UPDATE_STATUS), { recursive: true });
    let prev = {};
    try {
      prev = JSON.parse(fs.readFileSync(SELF_UPDATE_STATUS, "utf8"));
    } catch {
      prev = {};
    }
    const next = { ...prev, ...patch };
    const tmp = `${SELF_UPDATE_STATUS}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2), "utf8");
    fs.renameSync(tmp, SELF_UPDATE_STATUS);
  } catch (e) {
    say(`no se pudo escribir self-update status: ${e?.message || e}`);
  }
}

function appendSelfLog(msg) {
  try {
    let prev = {};
    try {
      prev = JSON.parse(fs.readFileSync(SELF_UPDATE_STATUS, "utf8"));
    } catch {
      prev = {};
    }
    const log = Array.isArray(prev.log) ? [...prev.log, msg] : [msg];
    writeSelfUpdateState({ log, status: prev.status || "updating" });
  } catch {
    /* ignore */
  }
}

/** Build Next en carpeta staging y swap atómico a .next antes del restart. */
function buildGestorSafe(root, push) {
  const staging = path.join(root, GESTOR_STAGING_DIR);
  const live = path.join(root, ".next");
  const prev = path.join(root, GESTOR_PREV_DIR);

  // Limpiar solo staging/prev — nunca rm -rf .next en vivo
  try {
    fs.rmSync(staging, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  try {
    fs.rmSync(prev, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  push(`npm run build (distDir=${GESTOR_STAGING_DIR})…`);
  const build = run("npm", ["run", "build"], root, {
    timeout: 600_000,
    envExtra: { NEXT_DIST_DIR: GESTOR_STAGING_DIR },
  });
  if (build.status !== 0) {
    return {
      ok: false,
      reason: build.stderr || build.stdout || "npm run build falló",
    };
  }
  if (!fs.existsSync(staging)) {
    return { ok: false, reason: `No se generó ${GESTOR_STAGING_DIR}` };
  }
  push("build staging OK — swap a .next");

  // Swap: .next → .next-prev, staging → .next (sin borrar el live primero)
  try {
    if (fs.existsSync(live)) {
      fs.renameSync(live, prev);
    }
    fs.renameSync(staging, live);
  } catch (e) {
    // Intentar restaurar si el swap a medias
    try {
      if (!fs.existsSync(live) && fs.existsSync(prev)) {
        fs.renameSync(prev, live);
      }
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      reason: e?.message || "swap .next falló",
    };
  }

  // Limpieza best-effort del build anterior (ya no sirve el proceso viejo tras restart)
  try {
    fs.rmSync(prev, { recursive: true, force: true });
  } catch {
    push("aviso: no se pudo borrar .next-prev (se puede limpiar luego)");
  }
  push("swap .next OK");
  return { ok: true };
}

function run(
  cmd,
  args,
  cwd,
  { inherit = false, timeout = 180_000, envExtra = {} } = {},
) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
    shell: false,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", ...envExtra },
    timeout,
  });
  return {
    status: r.error?.code === "ETIMEDOUT" ? 124 : (r.status ?? 1),
    stdout: (r.stdout || "").trim(),
    stderr: (r.stderr || r.error?.message || "").trim(),
  };
}

function git(args, cwd) {
  return run("git", args, cwd);
}

function isGitRepo(root) {
  return fs.existsSync(path.join(root, ".git"));
}

function headOf(root) {
  if (!isGitRepo(root)) return null;
  const r = git(["rev-parse", "HEAD"], root);
  return r.status === 0 ? r.stdout : null;
}

function fetchAndBehind(root, { fetchRemote = true } = {}) {
  if (!isGitRepo(root)) {
    return { ok: false, behind: 0, ahead: 0, error: "no-git" };
  }
  if (fetchRemote) {
    const f = run("git", ["fetch", "--quiet", "--no-tags"], root, {
      timeout: 60_000,
    });
    if (f.status === 124) {
      return { ok: false, behind: 0, ahead: 0, error: "git-fetch-timeout" };
    }
  }
  const behind = git(["rev-list", "--count", "HEAD..@{u}"], root);
  const ahead = git(["rev-list", "--count", "@{u}..HEAD"], root);
  if (behind.status !== 0) {
    const bMain = git(["rev-list", "--count", "HEAD..origin/main"], root);
    const aMain = git(["rev-list", "--count", "origin/main..HEAD"], root);
    if (bMain.status === 0) {
      return {
        ok: true,
        behind: Number(bMain.stdout) || 0,
        ahead: Number(aMain.stdout) || 0,
        branch: "origin/main",
      };
    }
    return {
      ok: false,
      behind: 0,
      ahead: 0,
      error: behind.stderr || "no-upstream",
    };
  }
  return {
    ok: true,
    behind: Number(behind.stdout) || 0,
    ahead: Number(ahead.stdout) || 0,
  };
}

function statusOf(app, { fetchRemote = true } = {}) {
  const st = fetchAndBehind(app.root, { fetchRemote });
  return {
    id: app.id,
    title: app.title,
    root: app.root,
    head: headOf(app.root)?.slice(0, 7) || null,
    ...st,
    needsUpdate: Boolean(st.ok && st.behind > 0),
  };
}

function updateOne(
  app,
  {
    force = false,
    dryRun = false,
    doGit = true,
    doSync = true,
    doPm2 = true,
  } = {},
) {
  const log = [];
  const push = (msg) => {
    log.push(msg);
    say(`${app.id}: ${msg}`);
  };

  const before = statusOf(app, { fetchRemote: !dryRun && doGit });
  if (!before.ok && before.error === "no-git" && doGit) {
    return {
      id: app.id,
      title: app.title,
      ok: false,
      skipped: true,
      dryRun,
      reason: "Sin repositorio git",
      log,
      status: before,
    };
  }

  if (doGit && !force && before.ok && before.behind === 0) {
    push("Ya está al día en git — se siguen los pasos marcados");
  }

  if (dryRun) {
    if (doGit) push(`[DRY-RUN] Simularía: git pull en ${app.root}`);
    if (doSync && app.sync && app.backend && fs.existsSync(app.backend)) {
      push(`[DRY-RUN] Simularía: npm run db:sync en ${app.backend}`);
    }
    if (app.build) {
      push(
        app.id === "gestor"
          ? `[DRY-RUN] Simularía: build → ${GESTOR_STAGING_DIR} → swap .next`
          : `[DRY-RUN] Simularía: npm run build en ${app.root}`,
      );
    }
    if (doPm2 && app.pm2) push(`[DRY-RUN] Simularía: pm2 restart ${app.pm2}`);
    push(`[DRY-RUN] OK — sin cambios reales`);
    return {
      id: app.id,
      title: app.title,
      ok: true,
      skipped: false,
      dryRun: true,
      reason: "Simulado (dry-run)",
      log,
      status: before,
    };
  }

  if (doGit) {
    push(`git pull (${before.behind || "?"} commits atrás)…`);
    let pull = git(["pull", "--ff-only"], app.root);
    if (pull.status !== 0) {
      push("ff-only falló → pull --rebase");
      pull = git(["pull", "--rebase", "origin", "HEAD"], app.root);
    }
    if (pull.status !== 0) {
      return {
        id: app.id,
        title: app.title,
        ok: false,
        skipped: false,
        dryRun: false,
        reason: pull.stderr || pull.stdout || "git pull falló",
        log,
        status: statusOf(app, { fetchRemote: false }),
      };
    }
    push("pull OK");
  } else {
    push("git pull omitido");
  }

  if (doSync && app.sync && app.backend && fs.existsSync(app.backend)) {
    push("npm run db:sync…");
    const sync = run("npm", ["run", "db:sync"], app.backend);
    if (sync.status !== 0) {
      return {
        id: app.id,
        title: app.title,
        ok: false,
        skipped: false,
        dryRun: false,
        reason: sync.stderr || sync.stdout || "db:sync falló",
        log,
        status: statusOf(app, { fetchRemote: false }),
      };
    }
    push("db:sync OK");
  } else if (!doSync) {
    push("db:sync omitido");
  }

  if (app.build) {
    if (app.id === "gestor") {
      const built = buildGestorSafe(app.root, push);
      if (!built.ok) {
        return {
          id: app.id,
          title: app.title,
          ok: false,
          skipped: false,
          dryRun: false,
          reason: built.reason,
          log,
          status: statusOf(app, { fetchRemote: false }),
        };
      }
    } else {
      push("npm run build…");
      const build = run("npm", ["run", "build"], app.root, {
        timeout: 600_000,
      });
      if (build.status !== 0) {
        return {
          id: app.id,
          title: app.title,
          ok: false,
          skipped: false,
          dryRun: false,
          reason: build.stderr || build.stdout || "npm run build falló",
          log,
          status: statusOf(app, { fetchRemote: false }),
        };
      }
      push("build OK");
    }
  }

  if (doPm2 && app.pm2) {
    // Solo restart del proceso indicado (PM2_APP / nombre de la app). Nunca kill/delete/all.
    push(`pm2 restart ${app.pm2}…`);
    const pm2 = run("pm2", ["restart", app.pm2], GESTOR_ROOT, {
      timeout: 120_000,
    });
    if (pm2.status !== 0) {
      push(
        `aviso: pm2 restart falló (${pm2.stderr || pm2.stdout || pm2.status})`,
      );
    } else {
      push("pm2 OK");
    }
  } else if (!doPm2) {
    push("pm2 omitido");
  }

  return {
    id: app.id,
    title: app.title,
    ok: true,
    skipped: false,
    dryRun: false,
    reason: "Actualizado",
    log,
    status: statusOf(app, { fetchRemote: false }),
  };
}

function parseArgs(argv) {
  const out = {
    mode: "status",
    app: null,
    force: false,
    dryRun: null,
    doGit: true,
    doSync: true,
    doPm2: true,
  };
  for (const a of argv) {
    if (a.startsWith("--mode=")) out.mode = a.slice(7);
    else if (a.startsWith("--app=")) out.app = a.slice(6);
    else if (a === "--force") out.force = true;
    else if (a === "--status") out.mode = "status";
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--live") out.dryRun = false;
    else if (a === "--no-git") out.doGit = false;
    else if (a === "--no-sync") out.doSync = false;
    else if (a === "--no-pm2") out.doPm2 = false;
    else if (a.startsWith("--steps=")) {
      const parts = new Set(
        a
          .slice(8)
          .split(",")
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean),
      );
      out.doGit = parts.has("git");
      out.doSync = parts.has("sync");
      out.doPm2 = parts.has("pm2");
    }
  }
  return out;
}

/** Real por defecto. Solo dry-run si UPDATE_APPS_DRY_RUN=1 o --dry-run. */
function resolveDryRun(flag) {
  if (flag === true) return true;
  if (flag === false) return false;
  if (process.env.UPDATE_APPS_LIVE === "1") return false;
  if (process.env.UPDATE_APPS_DRY_RUN === "1") return true;
  return false;
}

function main() {
  const {
    mode,
    app: appId,
    force,
    dryRun: dryFlag,
    doGit,
    doSync,
    doPm2,
  } = parseArgs(process.argv.slice(2));
  const dryRun = resolveDryRun(dryFlag);
  // status también hace git fetch para “Verificar” en la UI
  const wantFetch = !dryRun && doGit;
  const trioStatuses = TRIO.map((id) =>
    statusOf(APPS[id], { fetchRemote: wantFetch }),
  );

  if (mode === "status") {
    const gestorStatus = statusOf(APPS.gestor, { fetchRemote: wantFetch });
    const payload = {
      ok: true,
      systemVersion: SYSTEM_VERSION,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
      dryRunDefault: dryRun,
      gestor: gestorStatus,
      apps: [
        ...trioStatuses,
        statusOf(APPS.raptor, { fetchRemote: wantFetch }),
        gestorStatus,
      ],
      missing: trioStatuses.filter((s) => s.needsUpdate).map((s) => s.id),
    };
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    process.exit(0);
  }

  say(
    `Inicio mode=${mode} dryRun=${dryRun} force=${force} v=${SYSTEM_VERSION} appsweb=${APPSWEB}`,
  );

  let targets = [];
  if (mode === "all") {
    targets = TRIO.map((id) => APPS[id]);
  } else if (mode === "missing") {
    targets = trioStatuses.filter((s) => s.needsUpdate).map((s) => APPS[s.id]);
  } else if (mode === "one") {
    if (!appId || !APPS[appId]) {
      process.stdout.write(
        `${JSON.stringify({ ok: false, error: "Falta --app=eddeli|store|tienda|raptor|gestor" })}\n`,
      );
      process.exit(1);
    }
    targets = [APPS[appId]];
  } else {
    process.stdout.write(
      `${JSON.stringify({ ok: false, error: `mode inválido: ${mode}` })}\n`,
    );
    process.exit(1);
  }

  if (targets.length === 0) {
    const payload = {
      ok: true,
      mode,
      dryRun,
      systemVersion: SYSTEM_VERSION,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
      results: [],
      missingAfter: [],
      message: "Nada que actualizar: las 3 apps ya están al día",
    };
    say(payload.message);
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    process.exit(0);
  }

  // all / one: siempre intentar pull. missing: solo las atrasadas.
  const useForce = force || mode === "one" || mode === "all";
  say(`Pasos: git=${doGit} sync=${doSync} pm2=${doPm2}`);

  const updatingGestor = targets.some((t) => t.id === "gestor");
  const headBefore = updatingGestor
    ? headOf(APPS.gestor.root)?.slice(0, 7) || null
    : null;
  if (updatingGestor) {
    writeSelfUpdateState({
      status: "updating",
      acceptedAt: new Date().toISOString(),
      headBefore,
      headAfter: null,
      error: null,
      dryRun,
      pid: process.pid,
      log: [`Script iniciado pid=${process.pid}`],
    });
  }

  const results = targets.map((app) => {
    const r = updateOne(app, {
      force: useForce,
      dryRun,
      doGit,
      doSync,
      doPm2,
    });
    if (app.id === "gestor") {
      for (const line of r.log || []) appendSelfLog(line);
    }
    return r;
  });

  const worst = results.some((r) => !r.ok && !r.skipped);
  const payload = {
    ok: !worst,
    mode,
    dryRun,
    systemVersion: SYSTEM_VERSION,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL,
    results,
    missingAfter: TRIO.map((id) => statusOf(APPS[id], { fetchRemote: false }))
      .filter((s) => s.needsUpdate)
      .map((s) => s.id),
  };

  if (updatingGestor) {
    const gestorResult = results.find((r) => r.id === "gestor");
    const headAfter = headOf(APPS.gestor.root)?.slice(0, 7) || null;
    writeSelfUpdateState({
      status: worst ? "error" : "ok",
      finishedAt: new Date().toISOString(),
      headBefore,
      headAfter,
      error: worst
        ? gestorResult?.reason || "La actualización terminó con errores"
        : null,
      dryRun,
      pid: process.pid,
      log: gestorResult?.log || [],
    });
  }

  say(`Fin ok=${payload.ok} apps=${results.length} dryRun=${dryRun}`);
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(worst ? 1 : 0);
}

main();
