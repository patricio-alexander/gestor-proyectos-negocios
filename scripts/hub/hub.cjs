#!/usr/bin/env node
/**
 * Hub Raptor Solutions (gestor) · un solo menú para:
 * simulares, scripts por app, git pull/push, compilar Vite (1 o 3), PM2.
 *
 * Uso (desde gestor-proyectos-negocios/):
 *   npm run scripts
 *   npm run script
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const {
  c,
  selectList,
  askText,
  askConfirm,
  waitEnter,
} = require("./menu-ui.cjs");

const GESTOR_ROOT = path.resolve(__dirname, "../..");
const APPSWEB = path.resolve(GESTOR_ROOT, "..");

try {
  require("dotenv").config({ path: path.join(GESTOR_ROOT, ".env") });
} catch {
  /* optional */
}

const NEVER_ADD = [
  ".env",
  ".env.local",
  ".env.development.local",
  ".env.production.local",
  ".env.test.local",
];

const GIT_REPOS = [
  {
    id: "gestor",
    title: "Raptor Solutions (gestor)",
    root: GESTOR_ROOT,
  },
  {
    id: "eddeli",
    title: "EdDeli",
    root: path.join(APPSWEB, "eddeli"),
  },
  {
    id: "store",
    title: "Store",
    root: path.join(APPSWEB, "store"),
  },
  {
    id: "tienda",
    title: "Tienda",
    root: path.join(APPSWEB, "tienda"),
  },
  {
    id: "scheduly",
    title: "Scheduly",
    root: path.join(APPSWEB, "scheduly"),
  },
  {
    id: "simulador",
    title: "Simulador",
    root: path.join(APPSWEB, "simulador"),
  },
  {
    id: "raptor",
    title: "Raptor (front Vite)",
    root: path.join(APPSWEB, "raptor"),
  },
];

const TRIO_IDS = new Set(["eddeli", "store", "tienda"]);
const VITE_IDS = ["eddeli", "store", "tienda"];

const APPS = [
  {
    id: "scheduly",
    title: "Scheduly · scripts / simulaciones",
    desc: "Bots, simulación web, testers y git de Scheduly.",
    color: "cyan",
    cwd: path.join(APPSWEB, "scheduly"),
    cmd: ["npm", "run", "script"],
  },
  {
    id: "simulador",
    title: "Simulador · consola",
    desc: "Misma lógica que la web :8787, logs en terminal.",
    color: "green",
    cwd: path.join(APPSWEB, "simulador"),
    cmd: ["npm", "run", "sim"],
  },
  {
    id: "eddeli",
    title: "EdDeli · scripts backend",
    desc: "Imágenes, backup, db:sync y utilidades del backend.",
    color: "magenta",
    cwd: path.join(APPSWEB, "eddeli", "backend"),
    cmd: ["node", "scripts/menu.js"],
  },
  {
    id: "store",
    title: "Store · scripts backend",
    desc: "Utilidades del backend Store.",
    color: "yellow",
    cwd: path.join(APPSWEB, "store", "backend"),
    cmd: ["node", "scripts/menu.js"],
  },
  {
    id: "tienda",
    title: "Tienda · scripts backend",
    desc: "Utilidades del backend Tienda.",
    color: "blue",
    cwd: path.join(APPSWEB, "tienda", "backend"),
    cmd: ["node", "scripts/menu.js"],
  },
];

function run(cmd, args, cwd) {
  process.stdout.write(c.show);
  console.log(`\n${c.dim}→ ${cmd} ${args.join(" ")}  (${cwd})${c.reset}\n`);
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  return r.status ?? 1;
}

function git(args, cwd, opts = {}) {
  return spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    env: process.env,
    stdio: opts.inherit ? "inherit" : "pipe",
  });
}

function isGitRepo(root) {
  return fs.existsSync(path.join(root, ".git"));
}

function listGitRepos(filterIds = null) {
  return GIT_REPOS.filter((r) => {
    if (filterIds && !filterIds.has(r.id)) return false;
    return isGitRepo(r.root);
  });
}

function repoShortStatus(root) {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], root);
  const status = git(["status", "-sb"], root);
  const porcelain = git(["status", "--porcelain"], root);
  const dirty = Boolean((porcelain.stdout || "").trim());
  return {
    branch: (branch.stdout || "").trim() || "?",
    statusLine: (status.stdout || status.stderr || "").trim(),
    dirty,
    ok: (branch.status ?? 1) === 0,
  };
}

function stageAllSafe(root) {
  const add = git(["add", "-A"], root);
  if ((add.status ?? 1) !== 0) return add;
  for (const secret of NEVER_ADD) {
    const full = path.join(root, secret);
    if (!fs.existsSync(full)) continue;
    git(["reset", "HEAD", "--", secret], root);
    console.log(`  ${c.dim}(omitido secreto) ${secret}${c.reset}`);
  }
  // También .env en subcarpetas comunes
  for (const rel of ["backend/.env", "frontend/.env"]) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    git(["reset", "HEAD", "--", rel], root);
    console.log(`  ${c.dim}(omitido secreto) ${rel}${c.reset}`);
  }
  return add;
}

function printGitStatus(filterIds = null) {
  process.stdout.write(c.clear + c.show);
  const label = filterIds
    ? `Git · estado (${[...filterIds].join(", ")})`
    : "Git · estado (todas)";
  console.log(`${c.brightMagenta}${c.bold}${label}${c.reset}\n`);
  const repos = listGitRepos(filterIds);
  if (!repos.length) {
    console.log(`${c.red}No hay repos git configurados.${c.reset}`);
    return;
  }
  for (const repo of repos) {
    const st = repoShortStatus(repo.root);
    const mark = st.dirty
      ? `${c.yellow}● cambios${c.reset}`
      : `${c.green}○ limpio${c.reset}`;
    console.log(
      `${c.brightCyan}${c.bold}${repo.title}${c.reset}  ${mark}  ${c.dim}${repo.root}${c.reset}`,
    );
    if (!st.ok) {
      console.log(`  ${c.red}No es un repo git usable.${c.reset}\n`);
      continue;
    }
    console.log(`  Rama: ${c.brightCyan}${st.branch}${c.reset}`);
    console.log(`  ${st.statusLine || "(sin salida)"}\n`);
  }
}

async function gitPull(filterIds = null) {
  printGitStatus(filterIds);
  const ok = await askConfirm(
    `${c.brightGreen}¿Bajar cambios (git pull --ff-only) en estos repos?${c.reset}`,
  );
  if (!ok) {
    console.log(`${c.dim}Cancelado.${c.reset}`);
    await waitEnter();
    return 1;
  }
  console.log(`\n${c.brightGreen}Pull…${c.reset}\n`);
  let worst = 0;
  for (const repo of listGitRepos(filterIds)) {
    console.log(`${c.cyan}→ ${repo.title}${c.reset}`);
    const r = git(["pull", "--ff-only"], repo.root, { inherit: true });
    if ((r.status ?? 1) !== 0) {
      console.log(
        `${c.yellow}ff-only falló; intento pull --rebase…${c.reset}`,
      );
      const rb = git(["pull", "--rebase", "origin", "HEAD"], repo.root, {
        inherit: true,
      });
      worst = Math.max(worst, rb.status ?? 1);
    } else {
      worst = Math.max(worst, r.status ?? 1);
    }
    console.log("");
  }
  await waitEnter();
  return worst;
}

function compileSteps(filterIds) {
  const frontend = path.join(APPSWEB, "raptor", "frontend");
  const steps = [];
  const ids = filterIds
    ? [...filterIds]
    : VITE_IDS;
  for (const id of ids) {
    if (!VITE_IDS.includes(id)) continue;
    const title =
      GIT_REPOS.find((r) => r.id === id)?.title || id;
    steps.push({
      title: `Front Vite ${title}`,
      cwd: frontend,
      args: ["run", `build-${id}`],
    });
  }
  return steps;
}

async function compileBeforePush(filterIds) {
  const steps = compileSteps(filterIds);
  if (!steps.length) return 0;
  const frontend = path.join(APPSWEB, "raptor", "frontend");
  if (!fs.existsSync(path.join(frontend, "package.json"))) {
    console.log(`${c.red}No está el front de Raptor para compilar.${c.reset}`);
    return 1;
  }
  console.log(`\n${c.brightCyan}${c.bold}Compilando…${c.reset}`);
  for (const step of steps) {
    console.log(`\n${c.cyan}══ Compilar ${step.title} ══${c.reset}`);
    const code = run("npm", step.args, step.cwd);
    if (code !== 0) {
      console.log(
        `${c.red}No se compiló ${step.title}. No se sube nada.${c.reset}`,
      );
      return code;
    }
  }
  return 0;
}

async function gitPush(filterIds = null, { compile = false } = {}) {
  printGitStatus(filterIds);
  if (compile) {
    const labels = [...(filterIds || TRIO_IDS)].join(", ");
    const go = await askConfirm(
      `${c.brightGreen}¿Compilar Vite (${labels}) y luego subir?${c.reset}`,
    );
    if (!go) {
      console.log(`${c.dim}Cancelado.${c.reset}`);
      await waitEnter();
      return 1;
    }
    const built = await compileBeforePush(filterIds || TRIO_IDS);
    if (built !== 0) {
      await waitEnter();
      return built;
    }
  }

  const repos = listGitRepos(filterIds);
  const dirty = repos.filter((r) => repoShortStatus(r.root).dirty);

  if (!dirty.length) {
    console.log(
      `\n${c.yellow}Ningún repo tiene cambios para commitear.${c.reset}`,
    );
    const pushClean = await askConfirm(
      `${c.brightGreen}¿Hacer push de la rama actual igual?${c.reset}`,
    );
    if (!pushClean) {
      console.log(`${c.dim}Cancelado.${c.reset}`);
      await waitEnter();
      return 1;
    }
    let worst = 0;
    for (const repo of repos) {
      console.log(`\n${c.cyan}→ push ${repo.title}${c.reset}`);
      const r = git(["push", "-u", "origin", "HEAD"], repo.root, {
        inherit: true,
      });
      worst = Math.max(worst, r.status ?? 1);
    }
    await waitEnter();
    return worst;
  }

  console.log(
    `\n${c.dim}Repos con cambios:${c.reset} ${dirty.map((r) => r.title).join(", ")}`,
  );
  const msg = await askText(
    `${c.brightCyan}Mensaje del commit${c.reset}`,
    `update ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
  );
  if (!msg) {
    console.log(`${c.dim}Cancelado.${c.reset}`);
    await waitEnter();
    return 1;
  }
  const ok = await askConfirm(
    `${c.brightGreen}¿Commit + push en ${dirty.length} repo(s) con «${msg}»?${c.reset}`,
  );
  if (!ok) {
    console.log(`${c.dim}Cancelado.${c.reset}`);
    await waitEnter();
    return 1;
  }

  let worst = 0;
  for (const repo of dirty) {
    console.log(`\n${c.cyan}══ ${repo.title} ══${c.reset}`);
    stageAllSafe(repo.root);
    const commit = git(["commit", "-m", msg], repo.root, { inherit: true });
    if ((commit.status ?? 1) !== 0) {
      console.log(
        `${c.yellow}Commit falló o no había cambios staged en ${repo.title}.${c.reset}`,
      );
      worst = Math.max(worst, commit.status ?? 1);
      continue;
    }
    const push = git(["push", "-u", "origin", "HEAD"], repo.root, {
      inherit: true,
    });
    worst = Math.max(worst, push.status ?? 1);
  }
  await waitEnter();
  return worst;
}

async function buildScheduly() {
  process.stdout.write(c.clear + c.show);
  const cwd = path.join(APPSWEB, "scheduly");
  if (!fs.existsSync(path.join(cwd, "package.json"))) {
    console.log(`${c.red}No está Scheduly.${c.reset}`);
    await waitEnter();
    return 1;
  }
  const code = run("npm", ["run", "build"], cwd);
  await waitEnter();
  return code;
}

async function buildGestor() {
  process.stdout.write(c.clear + c.show);
  const code = run("npm", ["run", "build"], GESTOR_ROOT);
  await waitEnter();
  return code;
}

async function syncCatalog() {
  process.stdout.write(c.clear + c.show);
  const code = run("npm", ["run", "db:sync-catalog"], GESTOR_ROOT);
  await waitEnter();
  return code;
}

async function deployGestor() {
  process.stdout.write(c.clear + c.show);
  const ok = await askConfirm(
    `${c.brightGreen}¿Correr deploy.sh aquí (pull + build + pm2)?${c.reset}`,
  );
  if (!ok) {
    console.log(`${c.dim}Cancelado.${c.reset}`);
    await waitEnter();
    return 1;
  }
  const code = run("bash", ["scripts/deploy.sh"], GESTOR_ROOT);
  await waitEnter();
  return code;
}

async function pm2RestartLocal() {
  process.stdout.write(c.clear + c.show);
  const name = process.env.PM2_APP || "Raptor Solutions";
  const ok = await askConfirm(
    `${c.brightGreen}¿Reiniciar PM2 «${name}» (y ecosystem si hace falta)?${c.reset}`,
  );
  if (!ok) {
    console.log(`${c.dim}Cancelado.${c.reset}`);
    await waitEnter();
    return 1;
  }
  let code = run("pm2", ["restart", "ecosystem.config.cjs"], GESTOR_ROOT);
  if (code !== 0) {
    code = run("pm2", ["restart", name], GESTOR_ROOT);
  }
  if (code !== 0) {
    code = run("pm2", ["start", "ecosystem.config.cjs"], GESTOR_ROOT);
  }
  run("pm2", ["save"], GESTOR_ROOT);
  await waitEnter();
  return code;
}

async function pm2RestartServer() {
  process.stdout.write(c.clear + c.show);
  const host = process.env.HUB_SSH_HOST || process.env.DEPLOY_SSH_HOST || "";
  const user = process.env.HUB_SSH_USER || process.env.DEPLOY_SSH_USER || "";
  const remotePath =
    process.env.HUB_SSH_PATH ||
    process.env.DEPLOY_SSH_PATH ||
    "";
  const pm2Name = process.env.HUB_SSH_PM2 || process.env.PM2_APP || "Raptor Solutions";

  if (!host || !user || !remotePath) {
    console.log(
      `${c.yellow}Falta configurar SSH en .env del gestor:${c.reset}\n` +
        `  HUB_SSH_HOST=…\n` +
        `  HUB_SSH_USER=…\n` +
        `  HUB_SSH_PATH=/ruta/al/gestor-en-servidor\n` +
        `  HUB_SSH_PM2=${pm2Name}  ${c.dim}(opcional)${c.reset}\n`,
    );
    await waitEnter();
    return 1;
  }

  const target = `${user}@${host}`;
  console.log(
    `${c.dim}Servidor:${c.reset} ${target}\n` +
      `${c.dim}Ruta:${c.reset} ${remotePath}\n` +
      `${c.dim}PM2:${c.reset} ${pm2Name}\n`,
  );
  const ok = await askConfirm(
    `${c.brightGreen}¿git pull + pm2 restart en el servidor?${c.reset}`,
  );
  if (!ok) {
    console.log(`${c.dim}Cancelado.${c.reset}`);
    await waitEnter();
    return 1;
  }

  const remoteCmd = [
    `cd ${JSON.stringify(remotePath)}`,
    "git pull --ff-only || git pull --rebase",
    `pm2 restart ${JSON.stringify(pm2Name)} || pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs`,
    "pm2 save || true",
  ].join(" && ");

  const code = run("ssh", [target, remoteCmd], GESTOR_ROOT);
  await waitEnter();
  return code;
}

function menuRows() {
  const rows = APPS.map((a) => {
    const ok = fs.existsSync(path.join(a.cwd, "package.json"));
    return {
      id: `app:${a.id}`,
      title: ok ? a.title : `${a.title} (faltan archivos)`,
      desc: a.desc,
      color: a.color,
      app: a,
      missing: !ok,
    };
  });

  rows.push(
    {
      id: "sep-git",
      title: "── Git ──",
      desc: "Estado, bajar y subir repos.",
      color: "white",
      kind: "sep",
    },
    {
      id: "git-status",
      title: "Git · ver estado (todas)",
      desc: "Gestor, EdDeli, Store, Tienda, Scheduly, Simulador, Raptor.",
      color: "magenta",
    },
    {
      id: "git-pull",
      title: "Git · bajar cambios (todas)",
      desc: "git pull en cada repo.",
      color: "green",
      danger: "low",
    },
    {
      id: "git-pull-trio",
      title: "Git · bajar (EdDeli + Store + Tienda)",
      desc: "Pull solo en las 3 apps Vite.",
      color: "green",
      danger: "low",
    },
    {
      id: "git-pull-gestor",
      title: "Git · bajar (solo gestor)",
      desc: "pull en Raptor Solutions.",
      color: "green",
      danger: "low",
    },
    {
      id: "git-push",
      title: "Git · subir cambios (todas)",
      desc: "Commit + push sin compilar.",
      color: "yellow",
      danger: "med",
    },
    {
      id: "git-push-gestor",
      title: "Git · subir (solo gestor)",
      desc: "Commit + push de Raptor Solutions.",
      color: "yellow",
      danger: "med",
    },
    {
      id: "sep-vite",
      title: "── Vite · compilar y subir ──",
      desc: "Front de EdDeli / Store / Tienda.",
      color: "white",
      kind: "sep",
    },
    {
      id: "vite-push-all",
      title: "Compilar y subir · las 3 Vite",
      desc: "build-eddeli + build-store + build-tienda, luego commit + push.",
      color: "yellow",
      danger: "med",
    },
    {
      id: "vite-push-eddeli",
      title: "Compilar y subir · EdDeli",
      desc: "Solo front EdDeli + git de eddeli.",
      color: "magenta",
      danger: "med",
    },
    {
      id: "vite-push-store",
      title: "Compilar y subir · Store",
      desc: "Solo front Store + git de store.",
      color: "yellow",
      danger: "med",
    },
    {
      id: "vite-push-tienda",
      title: "Compilar y subir · Tienda",
      desc: "Solo front Tienda + git de tienda.",
      color: "blue",
      danger: "med",
    },
    {
      id: "sep-pm2",
      title: "── Servidor / PM2 ──",
      desc: "Reinicio local o remoto.",
      color: "white",
      kind: "sep",
    },
    {
      id: "pm2-local",
      title: "PM2 · reiniciar gestor (local)",
      desc: "pm2 restart ecosystem del gestor.",
      color: "cyan",
      danger: "med",
    },
    {
      id: "pm2-server",
      title: "PM2 · pull + reiniciar en servidor",
      desc: "SSH: git pull y pm2 restart (HUB_SSH_* en .env).",
      color: "red",
      danger: "high",
    },
    {
      id: "deploy-gestor",
      title: "Deploy gestor (local)",
      desc: "scripts/deploy.sh: pull + install + migrate + build + pm2.",
      color: "cyan",
      danger: "high",
    },
    {
      id: "sep-build",
      title: "── Build / catálogo ──",
      desc: "Compilaciones sueltas.",
      color: "white",
      kind: "sep",
    },
    {
      id: "build-scheduly",
      title: "Build Scheduly",
      desc: "npm run build en Scheduly.",
      color: "cyan",
      danger: "low",
    },
    {
      id: "build-gestor",
      title: "Build gestor (Next)",
      desc: "npm run build en Raptor Solutions.",
      color: "cyan",
      danger: "low",
    },
    {
      id: "sync-catalog",
      title: "Sincronizar catálogo de módulos",
      desc: "npm run db:sync-catalog (secciones como reporte financiero).",
      color: "green",
      danger: "low",
    },
    {
      id: "exit",
      title: "Salir",
      desc: "Cierra el hub.",
      kind: "exit",
      color: "red",
    },
  );
  return rows;
}

async function main() {
  while (true) {
    const row = await selectList(
      "Raptor Solutions",
      "Hub · apps, git, Vite, PM2",
      menuRows(),
    );
    if (!row || row.id === "exit") {
      process.stdout.write(c.clear + c.show);
      console.log("Listo.");
      return;
    }
    if (row.kind === "sep") continue;

    if (row.id.startsWith("app:") && row.app) {
      if (row.missing) {
        process.stdout.write(c.clear + c.show);
        console.log(`${c.red}No hay package.json en ${row.app.cwd}${c.reset}`);
        await waitEnter();
        continue;
      }
      run(row.app.cmd[0], row.app.cmd.slice(1), row.app.cwd);
      continue;
    }

    if (row.id === "git-status") {
      printGitStatus();
      await waitEnter();
      continue;
    }
    if (row.id === "git-pull") {
      await gitPull();
      continue;
    }
    if (row.id === "git-pull-trio") {
      await gitPull(TRIO_IDS);
      continue;
    }
    if (row.id === "git-pull-gestor") {
      await gitPull(new Set(["gestor"]));
      continue;
    }
    if (row.id === "git-push") {
      await gitPush();
      continue;
    }
    if (row.id === "git-push-gestor") {
      await gitPush(new Set(["gestor"]));
      continue;
    }
    if (row.id === "vite-push-all") {
      await gitPush(TRIO_IDS, { compile: true });
      continue;
    }
    if (row.id === "vite-push-eddeli") {
      await gitPush(new Set(["eddeli"]), { compile: true });
      continue;
    }
    if (row.id === "vite-push-store") {
      await gitPush(new Set(["store"]), { compile: true });
      continue;
    }
    if (row.id === "vite-push-tienda") {
      await gitPush(new Set(["tienda"]), { compile: true });
      continue;
    }
    if (row.id === "pm2-local") {
      await pm2RestartLocal();
      continue;
    }
    if (row.id === "pm2-server") {
      await pm2RestartServer();
      continue;
    }
    if (row.id === "deploy-gestor") {
      await deployGestor();
      continue;
    }
    if (row.id === "build-scheduly") {
      await buildScheduly();
      continue;
    }
    if (row.id === "build-gestor") {
      await buildGestor();
      continue;
    }
    if (row.id === "sync-catalog") {
      await syncCatalog();
      continue;
    }
  }
}

main().catch((err) => {
  process.stdout.write(c.show);
  console.error(err);
  process.exitCode = 1;
});
