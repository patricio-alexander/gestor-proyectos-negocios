#!/usr/bin/env node
/**
 * Hub Raptor Solutions (gestor).
 * Flujo: función primero → destino (gestor / raptor / las 3 / una).
 *   Git · Vite/Raptor · BD · Deploy/PM2 · Apps (menús internos)
 *
 * Uso (desde gestor-proyectos-negocios/):
 *   npm run scripts
 *   npm run update:all        # pull → deploy gestor si cambió → 3 Vite → pm2 restart all
 *   npm run update:all:yes    # igual, sin confirmación
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

/** Procesos PM2 conocidos (local/servidor). Env puede ampliar/renombrar. */
const PM2_PROCESSES = [
  {
    id: "gestor",
    title: "Raptor Solutions (gestor)",
    name: process.env.PM2_APP || "Raptor Solutions",
  },
  {
    id: "gestor-workers",
    title: "Workers del gestor (ecosystem)",
    name: null, // se reinicia con ecosystem.config.cjs
    ecosystem: true,
  },
  {
    id: "scheduly",
    title: "Scheduly",
    name: process.env.PM2_SCHEDULY || "scheduly",
  },
  {
    id: "eddeli",
    title: "EdDeli (backend)",
    name: process.env.PM2_EDDELI || "eddeli",
  },
  {
    id: "store",
    title: "Store (backend)",
    name: process.env.PM2_STORE || "store",
  },
  {
    id: "tienda",
    title: "Tienda (backend)",
    name: process.env.PM2_TIENDA || "tienda",
  },
];

/** Backends de las 3 apps Vite (para npm run db:* en las tres). */
const TRIO_BACKENDS = [
  {
    id: "eddeli",
    title: "EdDeli",
    cwd: path.join(APPSWEB, "eddeli", "backend"),
  },
  {
    id: "store",
    title: "Store",
    cwd: path.join(APPSWEB, "store", "backend"),
  },
  {
    id: "tienda",
    title: "Tienda",
    cwd: path.join(APPSWEB, "tienda", "backend"),
  },
];

/** Scripts npm db:* comunes a EdDeli / Store / Tienda. */
const TRIO_DB_SCRIPTS = [
  {
    id: "db:check-backup",
    title: "db:check-backup",
    desc: "Resumen de backup.json en cada app.",
    danger: "low",
  },
  {
    id: "db:verify:backup-json",
    title: "db:verify:backup-json",
    desc: "Detecta JSON corrupto en backup.",
    danger: "low",
  },
  {
    id: "db:seed:roles:dry",
    title: "db:seed:roles:dry",
    desc: "Simula roles canónicos en las 3 BDs.",
    danger: "low",
  },
  {
    id: "db:seed:roles",
    title: "db:seed:roles",
    desc: "Aplica Propietario/Admin/Empleado/Programador/Proveedor en las 3.",
    danger: "med",
    write: true,
  },
  {
    id: "db:sync",
    title: "db:sync",
    desc: "Solo tablas/columnas (ALTER). Sin bodega, stock ni limpieza de IDs.",
    danger: "med",
    write: true,
  },
  {
    id: "db:prepare",
    title: "db:prepare",
    desc: "Bodega/cajas/migración de stock/FK en las 3. No es sync de esquema.",
    danger: "high",
    write: true,
  },
  {
    id: "db:sync:categories",
    title: "db:sync:categories",
    desc: "ALTER solo categorías en las 3.",
    danger: "med",
    write: true,
  },
  {
    id: "db:sync:editor",
    title: "db:sync:editor",
    desc: "ALTER solo editor_templates en las 3.",
    danger: "med",
    write: true,
  },
  {
    id: "db:fix:expense-reference-fk",
    title: "db:fix:expense-reference-fk",
    desc: "Quita FK incorrecta de expenses en las 3.",
    danger: "med",
    write: true,
  },
  {
    id: "db:diagnose:supplier-pay",
    title: "db:diagnose:supplier-pay",
    desc: "Diagnóstico de pagos a proveedor (solo lee).",
    danger: "low",
  },
  {
    id: "db:audit:json-fields",
    title: "db:audit:json-fields",
    desc: "Audita JSON mal guardado.",
    danger: "low",
  },
  {
    id: "db:repair:json-fields",
    title: "db:repair:json-fields",
    desc: "Repara JSON mal escapados.",
    danger: "med",
    write: true,
  },
  {
    id: "db:patch:backup",
    title: "db:patch:backup",
    desc: "Normaliza backup.json al esquema actual.",
    danger: "med",
    write: true,
  },
  {
    id: "db:images:report",
    title: "db:images:report",
    desc: "Reporte barcodes/imágenes en las 3.",
    danger: "low",
  },
  {
    id: "db:reset",
    title: "db:reset",
    desc: "RESET destructivo desde backup.json en las 3. Cuidado.",
    danger: "high",
    write: true,
  },
];

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

function headOf(root) {
  const r = git(["rev-parse", "HEAD"], root);
  return (r.stdout || "").trim();
}

/**
 * Pull sin confirmación. Devuelve ids cuyo HEAD cambió.
 * @returns {{ worst: number, updated: Set<string>, titles: string[] }}
 */
function pullReposNow(filterIds = null) {
  const updated = new Set();
  const titles = [];
  let worst = 0;
  for (const repo of listGitRepos(filterIds)) {
    const before = headOf(repo.root);
    console.log(`${c.cyan}→ pull ${repo.title}${c.reset}`);
    let r = git(["pull", "--ff-only"], repo.root, { inherit: true });
    if ((r.status ?? 1) !== 0) {
      console.log(
        `${c.yellow}ff-only falló; intento pull --rebase…${c.reset}`,
      );
      r = git(["pull", "--rebase", "origin", "HEAD"], repo.root, {
        inherit: true,
      });
    }
    worst = Math.max(worst, r.status ?? 1);
    const after = headOf(repo.root);
    if (before && after && before !== after) {
      updated.add(repo.id);
      titles.push(repo.title);
    }
    console.log("");
  }
  return { worst, updated, titles };
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
  const { worst } = pullReposNow(filterIds);
  await waitEnter();
  return worst;
}

/**
 * Pipeline: pull todos → si gestor cambió deploy → actualizar 3 Vite → pm2 restart all.
 * @param {{ confirm?: boolean }} opts
 */
async function fullSyncAndDeploy({ confirm = true } = {}) {
  process.stdout.write(c.clear + c.show);
  console.log(
    `${c.brightMagenta}${c.bold}Actualizar todo${c.reset}\n\n` +
      `${c.dim}1.${c.reset} git pull en todos los repos\n` +
      `${c.dim}2.${c.reset} si Raptor Solutions (gestor) bajó cambios → deploy.sh\n` +
      `${c.dim}3.${c.reset} actualizar / recompilar las 3 apps Vite\n` +
      `${c.dim}4.${c.reset} pm2 restart all\n`,
  );

  if (confirm) {
    const ok = await askConfirm(
      `${c.brightGreen}¿Correr el flujo completo?${c.reset}`,
    );
    if (!ok) {
      console.log(`${c.dim}Cancelado.${c.reset}`);
      await waitEnter();
      return 1;
    }
  }

  console.log(`\n${c.brightGreen}${c.bold}══ 1) Pull de todos ══${c.reset}\n`);
  const pull = pullReposNow(null);
  if (pull.updated.size) {
    console.log(
      `${c.green}Repos con cambios nuevos:${c.reset} ${pull.titles.join(", ")}`,
    );
  } else {
    console.log(`${c.yellow}Ningún repo trajo commits nuevos.${c.reset}`);
  }

  const gestorUpdated = pull.updated.has("gestor");
  const anyUpdated = pull.updated.size > 0;

  let deployCode = 0;
  if (gestorUpdated) {
    console.log(
      `\n${c.brightCyan}${c.bold}══ 2) Deploy Raptor Solutions (gestor) ══${c.reset}\n`,
    );
    const r = spawnSync("bash", ["scripts/deploy.sh"], {
      cwd: GESTOR_ROOT,
      stdio: "inherit",
      env: { ...process.env, SKIP_PULL: "1", SKIP_PM2: "1" },
      shell: false,
    });
    deployCode = r.status ?? 1;
    if (deployCode !== 0) {
      console.log(
        `${c.red}Deploy del gestor falló (código ${deployCode}). Sigo con Vite/PM2.${c.reset}`,
      );
    }
  } else {
    console.log(
      `\n${c.dim}══ 2) Deploy gestor omitido (sin cambios nuevos) ══${c.reset}\n`,
    );
  }

  let viteCode = 0;
  console.log(
    `\n${c.brightCyan}${c.bold}══ 3) Las 3 apps Vite (EdDeli / Store / Tienda) ══${c.reset}\n`,
  );
  // Re-pull de las 3 por si el paso 1 dejó alguna atrás
  const trioPull = pullReposNow(TRIO_IDS);
  viteCode = Math.max(viteCode, trioPull.worst);

  const trioTouched = new Set([
    ...[...TRIO_IDS].filter((id) => pull.updated.has(id)),
    ...trioPull.updated,
  ]);
  const needViteBuild =
    pull.updated.has("raptor") || trioTouched.size > 0;

  for (const be of TRIO_BACKENDS) {
    if (!trioTouched.has(be.id)) continue;
    if (!fs.existsSync(path.join(be.cwd, "package.json"))) continue;
    console.log(`${c.cyan}→ npm install (${be.title} backend)${c.reset}`);
    viteCode = Math.max(viteCode, run("npm", ["install"], be.cwd));
  }

  if (needViteBuild) {
    console.log(
      `${c.cyan}→ Compilar fronts desde raptor/frontend → las 3 apps${c.reset}`,
    );
    viteCode = Math.max(viteCode, await compileBeforePush(TRIO_IDS));
  } else {
    console.log(
      `${c.dim}Raptor front / las 3 sin commits nuevos: no recompilo.${c.reset}`,
    );
  }

  console.log(
    `\n${c.brightMagenta}${c.bold}══ 4) pm2 restart all ══${c.reset}\n`,
  );
  const pm2Code = run("pm2", ["restart", "all"], GESTOR_ROOT);
  run("pm2", ["save"], GESTOR_ROOT);

  const worst = Math.max(pull.worst, deployCode, viteCode, pm2Code);
  console.log(
    `\n${worst === 0 ? c.brightGreen : c.yellow}${c.bold}Fin actualizar todo` +
      `${c.reset}` +
      (anyUpdated
        ? ` · actualizados: ${pull.titles.join(", ")}`
        : " · sin commits nuevos") +
      `  (pull:${pull.worst} deploy:${deployCode} vite:${viteCode} pm2:${pm2Code})\n`,
  );
  if (confirm) await waitEnter();
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

async function syncCatalog() {
  process.stdout.write(c.clear + c.show);
  const code = run("npm", ["run", "db:sync-catalog"], GESTOR_ROOT);
  await waitEnter();
  return code;
}

/**
 * Pickers de destino.
 * @returns {{ ok: false } | { ok: true, filter: Set|null }}  filter null = todos
 */
async function pickGitTargets(subtitle = "¿En qué repos?") {
  const row = await selectList("Git · destino", subtitle, [
    {
      id: "all",
      title: "Todas",
      desc: "Gestor, Raptor front, EdDeli, Store, Tienda, Scheduly, Simulador.",
      color: "magenta",
    },
    {
      id: "gestor",
      title: "Solo Raptor Solutions (gestor)",
      desc: "Repo gestor-proyectos-negocios /raptorsolutions.",
      color: "cyan",
    },
    {
      id: "raptor",
      title: "Solo Raptor (front Vite fuente)",
      desc: "Repo AppsWeb/raptor (código React compartido).",
      color: "yellow",
    },
    {
      id: "trio",
      title: "Las 3 apps Vite (builds)",
      desc: "EdDeli + Store + Tienda (assets compilados).",
      color: "cyan",
    },
    {
      id: "one",
      title: "Otra app…",
      desc: "Lista completa de repos.",
      color: "white",
    },
    { id: "back", title: "← Volver", desc: "Cancelar.", color: "white" },
  ]);
  if (!row || row.id === "back") return { ok: false };
  if (row.id === "all") return { ok: true, filter: null };
  if (row.id === "gestor") return { ok: true, filter: new Set(["gestor"]) };
  if (row.id === "raptor") return { ok: true, filter: new Set(["raptor"]) };
  if (row.id === "trio") return { ok: true, filter: TRIO_IDS };
  const one = await selectList("Git · una app", "Elegí el repo", [
    ...GIT_REPOS.map((r) => ({
      id: r.id,
      title: r.title,
      desc: r.root,
      color:
        r.id === "gestor" || r.id === "raptor"
          ? "magenta"
          : TRIO_IDS.has(r.id)
            ? "cyan"
            : "white",
    })),
    { id: "back", title: "← Volver", color: "white" },
  ]);
  if (!one || one.id === "back") return { ok: false };
  return { ok: true, filter: new Set([one.id]) };
}

/** @returns {{ ok: false } | { ok: true, filter: Set }} */
async function pickViteTargets(subtitle = "¿Qué fronts compilar?") {
  const row = await selectList("Vite · destino", subtitle, [
    {
      id: "trio",
      title: "Las 3 apps",
      desc: "Compila desde raptor/frontend → assets en EdDeli/Store/Tienda.",
      color: "cyan",
    },
    { id: "one", title: "Una app…", desc: "Solo un build.", color: "yellow" },
    { id: "back", title: "← Volver", color: "white" },
  ]);
  if (!row || row.id === "back") return { ok: false };
  if (row.id === "trio") return { ok: true, filter: TRIO_IDS };
  const one = await selectList("Vite · una app", "Elegí el build de salida", [
    ...VITE_IDS.map((id) => ({
      id,
      title: GIT_REPOS.find((r) => r.id === id)?.title || id,
      desc: `npm run build-${id} (fuente: raptor/frontend)`,
      color: id === "eddeli" ? "magenta" : id === "store" ? "yellow" : "blue",
    })),
    { id: "back", title: "← Volver", color: "white" },
  ]);
  if (!one || one.id === "back") return { ok: false };
  return { ok: true, filter: new Set([one.id]) };
}

/** @returns {{ ok: false } | { ok: true, backends: object[] }} */
async function pickTrioBackendTargets(subtitle = "¿En qué BDs?") {
  const row = await selectList("BD · destino", subtitle, [
    {
      id: "trio",
      title: "Las 3",
      desc: "EdDeli + Store + Tienda.",
      color: "cyan",
    },
    { id: "one", title: "Una…", desc: "Solo un backend.", color: "yellow" },
    { id: "back", title: "← Volver", color: "white" },
  ]);
  if (!row || row.id === "back") return { ok: false };
  if (row.id === "trio") return { ok: true, backends: TRIO_BACKENDS };
  const one = await selectList("BD · una app", "Elegí el backend", [
    ...TRIO_BACKENDS.map((a) => ({
      id: a.id,
      title: a.title,
      desc: a.cwd,
      color: a.id === "eddeli" ? "magenta" : a.id === "store" ? "yellow" : "blue",
      app: a,
    })),
    { id: "back", title: "← Volver", color: "white" },
  ]);
  if (!one || one.id === "back") return { ok: false };
  return { ok: true, backends: [one.app] };
}

async function runNpmOnBackends(scriptId, backends) {
  process.stdout.write(c.clear + c.show);
  const meta = TRIO_DB_SCRIPTS.find((s) => s.id === scriptId);
  const labels = backends.map((a) => a.title).join(" + ");
  console.log(
    `${c.brightCyan}${c.bold}npm run ${scriptId}${c.reset}  ${c.dim}en ${labels}${c.reset}\n`,
  );
  if (meta?.desc) console.log(`${c.white}${meta.desc}${c.reset}\n`);
  if (meta?.write) {
    console.log(
      `${c.yellow}${c.bold}Esta acción puede escribir en la(s) base(s) de datos.${c.reset}\n`,
    );
  }
  if (meta?.danger === "high") {
    console.log(
      `${c.red}${c.bold}ATENCIÓN: operación sensible / potencialmente destructiva.${c.reset}\n`,
    );
  }

  const ok = await askConfirm(
    `${c.brightGreen}¿Correr «npm run ${scriptId}» en ${labels}?${c.reset}`,
  );
  if (!ok) {
    console.log(`${c.dim}Cancelado.${c.reset}`);
    await waitEnter();
    return 1;
  }

  let worst = 0;
  for (const app of backends) {
    if (!fs.existsSync(path.join(app.cwd, "package.json"))) {
      console.log(
        `\n${c.red}✗ ${app.title}: no hay package.json en ${app.cwd}${c.reset}`,
      );
      worst = Math.max(worst, 1);
      continue;
    }
    console.log(`\n${c.cyan}══ ${app.title} · npm run ${scriptId} ══${c.reset}`);
    const code = run("npm", ["run", scriptId], app.cwd);
    worst = Math.max(worst, code);
  }
  console.log(
    `\n${worst === 0 ? c.green : c.yellow}Listo (peor exit=${worst}).${c.reset}`,
  );
  await waitEnter();
  return worst;
}

async function gitMenu() {
  while (true) {
    const action = await selectList(
      "Git",
      "1) Acción  →  2) Destino (todas / 3 Vite / una)",
      [
        {
          id: "status",
          title: "Ver estado",
          desc: "Rama y cambios.",
          color: "magenta",
        },
        {
          id: "pull",
          title: "Bajar cambios",
          desc: "git pull --ff-only (o rebase si hace falta).",
          color: "green",
          danger: "low",
        },
        {
          id: "push",
          title: "Subir cambios",
          desc: "Commit + push (sin compilar Vite).",
          color: "yellow",
          danger: "med",
        },
        { id: "back", title: "← Volver al hub", color: "white" },
      ],
    );
    if (!action || action.id === "back") return;

    const picked = await pickGitTargets(
      action.id === "status"
        ? "¿Estado de qué repos?"
        : action.id === "pull"
          ? "¿Pull en qué repos?"
          : "¿Push en qué repos?",
    );
    if (!picked.ok) continue;

    if (action.id === "status") {
      printGitStatus(picked.filter);
      await waitEnter();
    } else if (action.id === "pull") {
      await gitPull(picked.filter);
    } else if (action.id === "push") {
      await gitPush(picked.filter);
    }
  }
}

async function viteMenu() {
  while (true) {
    const action = await selectList(
      "Vite / Raptor front",
      "Fuente: AppsWeb/raptor · Salida: EdDeli/Store/Tienda",
      [
        {
          id: "build",
          title: "Solo compilar builds",
          desc: "npm run build-* desde raptor/frontend → assets de cada app.",
          color: "cyan",
          danger: "low",
        },
        {
          id: "build-push",
          title: "Compilar y subir builds",
          desc: "Build + commit/push de EdDeli/Store/Tienda (assets).",
          color: "yellow",
          danger: "med",
        },
        {
          id: "raptor-pull",
          title: "Git · bajar Raptor front (fuente)",
          desc: "pull del repo AppsWeb/raptor.",
          color: "green",
          danger: "low",
        },
        {
          id: "raptor-push",
          title: "Git · subir Raptor front (fuente)",
          desc: "commit + push del código React compartido.",
          color: "yellow",
          danger: "med",
        },
        { id: "back", title: "← Volver al hub", color: "white" },
      ],
    );
    if (!action || action.id === "back") return;

    if (action.id === "raptor-pull") {
      await gitPull(new Set(["raptor"]));
      continue;
    }
    if (action.id === "raptor-push") {
      await gitPush(new Set(["raptor"]));
      continue;
    }

    const picked = await pickViteTargets(
      action.id === "build" ? "¿Compilar qué apps?" : "¿Compilar y subir cuáles?",
    );
    if (!picked.ok) continue;

    if (action.id === "build") {
      process.stdout.write(c.clear + c.show);
      const code = await compileBeforePush(picked.filter);
      await waitEnter();
      void code;
    } else {
      await gitPush(picked.filter, { compile: true });
    }
  }
}

async function dbMenu() {
  while (true) {
    const script = await selectList(
      "BD",
      "1) Script npm  →  2) Destino (las 3 / una)",
      [
        ...TRIO_DB_SCRIPTS.map((s) => ({
          id: s.id,
          title: s.title,
          desc: s.desc,
          color:
            s.danger === "high"
              ? "red"
              : s.danger === "med"
                ? "yellow"
                : "green",
          danger: s.danger,
        })),
        { id: "back", title: "← Volver al hub", color: "white" },
      ],
    );
    if (!script || script.id === "back") return;

    const picked = await pickTrioBackendTargets(
      `¿Correr «${script.id}» en qué apps?`,
    );
    if (!picked.ok) continue;
    await runNpmOnBackends(script.id, picked.backends);
  }
}

async function appsMenu() {
  while (true) {
    const rows = [
      ...APPS.map((a) => {
        const ok = fs.existsSync(path.join(a.cwd, "package.json"));
        return {
          id: a.id,
          title: ok ? a.title : `${a.title} (faltan archivos)`,
          desc: a.desc,
          color: a.color,
          app: a,
          missing: !ok,
        };
      }),
      {
        id: "back",
        title: "← Volver al hub",
        desc: "Menú de scripts propios de cada app (BD local, etc.).",
        color: "white",
      },
    ];
    const row = await selectList(
      "Apps",
      "Menús internos (sin git; el git está en el hub)",
      rows,
    );
    if (!row || row.id === "back") return;
    if (row.missing) {
      process.stdout.write(c.clear + c.show);
      console.log(`${c.red}No hay package.json en ${row.app.cwd}${c.reset}`);
      await waitEnter();
      continue;
    }
    run(row.app.cmd[0], row.app.cmd.slice(1), row.app.cwd);
  }
}

/** @returns {{ ok: false } | { ok: true, mode: 'all'|'one', process?: object }} */
async function pickPm2Target(subtitle = "¿Qué reiniciar?") {
  const row = await selectList("PM2 · destino", subtitle, [
    {
      id: "all",
      title: "Todas (pm2 restart all)",
      desc: "Reinicia todos los procesos PM2 del entorno.",
      color: "magenta",
      danger: "high",
    },
    {
      id: "one",
      title: "Una app…",
      desc: "Raptor Solutions, workers, Scheduly, EdDeli, Store, Tienda…",
      color: "cyan",
      danger: "med",
    },
    { id: "back", title: "← Volver", color: "white" },
  ]);
  if (!row || row.id === "back") return { ok: false };
  if (row.id === "all") return { ok: true, mode: "all" };

  const one = await selectList("PM2 · una app", "Elegí el proceso", [
    ...PM2_PROCESSES.map((p) => ({
      id: p.id,
      title: p.title,
      desc: p.ecosystem
        ? "pm2 restart ecosystem.config.cjs (gestor)"
        : `pm2 restart «${p.name}»`,
      color: p.id === "gestor" ? "magenta" : "cyan",
    })),
    { id: "back", title: "← Volver", color: "white" },
  ]);
  if (!one || one.id === "back") return { ok: false };
  const proc = PM2_PROCESSES.find((p) => p.id === one.id);
  return { ok: true, mode: "one", process: proc };
}

async function deployMenu() {
  while (true) {
    const row = await selectList(
      "Deploy / PM2 · Raptor Solutions",
      "Gestor (raptorsolutions) · local o servidor",
      [
        {
          id: "update-all",
          title: "★ Actualizar todo",
          desc: "pull todos → deploy gestor si cambió → 3 Vite → pm2 restart all.",
          color: "magenta",
          danger: "high",
        },
        {
          id: "pull-gestor",
          title: "Git · bajar gestor",
          desc: "pull del repo Raptor Solutions (gestor-proyectos-negocios).",
          color: "green",
          danger: "low",
        },
        {
          id: "deploy-gestor",
          title: "Deploy gestor (local)",
          desc: "deploy.sh → pull + install + migrate + build + pm2.",
          color: "cyan",
          danger: "med",
        },
        {
          id: "pm2-local",
          title: "PM2 · reiniciar local",
          desc: "restart all o una app (Raptor Solutions, workers…).",
          color: "cyan",
          danger: "med",
        },
        {
          id: "pm2-server",
          title: "Servidor · pull + PM2",
          desc: "SSH: bajar cambios del gestor y reiniciar (all o una).",
          color: "red",
          danger: "high",
        },
        {
          id: "deploy-server",
          title: "Servidor · deploy completo",
          desc: "SSH: correr deploy.sh en la ruta del gestor.",
          color: "red",
          danger: "high",
        },
        {
          id: "build-scheduly",
          title: "Compilar Scheduly",
          desc: "npm run build en Scheduly.",
          color: "cyan",
          danger: "low",
        },
        {
          id: "sync-catalog",
          title: "Sincronizar catálogo de módulos",
          desc: "npm run db:sync-catalog en el gestor.",
          color: "green",
          danger: "low",
        },
        { id: "back", title: "← Volver al hub", color: "white" },
      ],
    );
    if (!row || row.id === "back") return;
    if (row.id === "update-all") await fullSyncAndDeploy();
    else if (row.id === "pull-gestor") await gitPull(new Set(["gestor"]));
    else if (row.id === "deploy-gestor") await deployGestor();
    else if (row.id === "pm2-local") await pm2RestartLocal();
    else if (row.id === "pm2-server") await pm2RestartServer({ pull: true });
    else if (row.id === "deploy-server") await deployGestorServer();
    else if (row.id === "build-scheduly") await buildScheduly();
    else if (row.id === "sync-catalog") await syncCatalog();
  }
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

function sshConfig() {
  const host = process.env.HUB_SSH_HOST || process.env.DEPLOY_SSH_HOST || "";
  const user = process.env.HUB_SSH_USER || process.env.DEPLOY_SSH_USER || "";
  const remotePath =
    process.env.HUB_SSH_PATH || process.env.DEPLOY_SSH_PATH || "";
  return { host, user, remotePath, target: host && user ? `${user}@${host}` : "" };
}

function printSshHint() {
  console.log(
    `${c.yellow}Falta configurar SSH en .env del gestor:${c.reset}\n` +
      `  HUB_SSH_HOST=…\n` +
      `  HUB_SSH_USER=…\n` +
      `  HUB_SSH_PATH=/ruta/al/gestor-en-servidor\n` +
      `  PM2_APP=Raptor Solutions  ${c.dim}(opcional)${c.reset}\n`,
  );
}

/** Ejecuta restart local según pick (all / ecosystem / nombre). */
function pm2DoLocal(picked) {
  if (picked.mode === "all") {
    const code = run("pm2", ["restart", "all"], GESTOR_ROOT);
    run("pm2", ["save"], GESTOR_ROOT);
    return code;
  }
  const proc = picked.process;
  if (proc?.ecosystem) {
    let code = run("pm2", ["restart", "ecosystem.config.cjs"], GESTOR_ROOT);
    if (code !== 0) {
      code = run("pm2", ["start", "ecosystem.config.cjs"], GESTOR_ROOT);
    }
    run("pm2", ["save"], GESTOR_ROOT);
    return code;
  }
  const name = proc?.name || process.env.PM2_APP || "Raptor Solutions";
  let code = run("pm2", ["restart", name], GESTOR_ROOT);
  if (code !== 0 && proc?.id === "gestor") {
    code = run("pm2", ["restart", "ecosystem.config.cjs"], GESTOR_ROOT);
    if (code !== 0) {
      code = run("pm2", ["start", "ecosystem.config.cjs"], GESTOR_ROOT);
    }
  }
  run("pm2", ["save"], GESTOR_ROOT);
  return code;
}

function pm2RemoteSnippet(picked) {
  if (picked.mode === "all") {
    return "pm2 restart all && (pm2 save || true)";
  }
  const proc = picked.process;
  if (proc?.ecosystem) {
    return (
      "pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs; " +
      "pm2 save || true"
    );
  }
  const name = proc?.name || process.env.PM2_APP || "Raptor Solutions";
  const q = JSON.stringify(name);
  if (proc?.id === "gestor") {
    return (
      `pm2 restart ${q} || pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs; ` +
      "pm2 save || true"
    );
  }
  return `pm2 restart ${q}; pm2 save || true`;
}

async function pm2RestartLocal() {
  const picked = await pickPm2Target("¿Reiniciar en local?");
  if (!picked.ok) return 1;

  process.stdout.write(c.clear + c.show);
  const label =
    picked.mode === "all"
      ? "pm2 restart all"
      : picked.process?.ecosystem
        ? "ecosystem del gestor"
        : `«${picked.process?.name}»`;
  const ok = await askConfirm(
    `${c.brightGreen}¿Reiniciar PM2 ${label}?${c.reset}`,
  );
  if (!ok) {
    console.log(`${c.dim}Cancelado.${c.reset}`);
    await waitEnter();
    return 1;
  }
  const code = pm2DoLocal(picked);
  await waitEnter();
  return code;
}

async function pm2RestartServer({ pull = true } = {}) {
  const picked = await pickPm2Target(
    pull
      ? "Servidor: bajar gestor y reiniciar PM2"
      : "Servidor: solo reiniciar PM2",
  );
  if (!picked.ok) return 1;

  process.stdout.write(c.clear + c.show);
  const { host, user, remotePath, target } = sshConfig();
  if (!host || !user || !remotePath) {
    printSshHint();
    await waitEnter();
    return 1;
  }

  const label =
    picked.mode === "all"
      ? "pm2 restart all"
      : picked.process?.ecosystem
        ? "ecosystem del gestor"
        : `«${picked.process?.name}»`;

  console.log(
    `${c.dim}Servidor:${c.reset} ${target}\n` +
      `${c.dim}Ruta gestor:${c.reset} ${remotePath}\n` +
      `${c.dim}PM2:${c.reset} ${label}\n` +
      `${c.dim}Git pull:${c.reset} ${pull ? "sí" : "no"}\n`,
  );
  const ok = await askConfirm(
    `${c.brightGreen}¿${pull ? "git pull + " : ""}${label} en el servidor?${c.reset}`,
  );
  if (!ok) {
    console.log(`${c.dim}Cancelado.${c.reset}`);
    await waitEnter();
    return 1;
  }

  const parts = [`cd ${JSON.stringify(remotePath)}`];
  if (pull) parts.push("git pull --ff-only || git pull --rebase");
  parts.push(pm2RemoteSnippet(picked));

  const code = run("ssh", [target, parts.join(" && ")], GESTOR_ROOT);
  await waitEnter();
  return code;
}

async function deployGestorServer() {
  process.stdout.write(c.clear + c.show);
  const { host, user, remotePath, target } = sshConfig();
  if (!host || !user || !remotePath) {
    printSshHint();
    await waitEnter();
    return 1;
  }

  console.log(
    `${c.dim}Servidor:${c.reset} ${target}\n` +
      `${c.dim}Ruta:${c.reset} ${remotePath}\n` +
      `${c.dim}Script:${c.reset} bash scripts/deploy.sh\n`,
  );
  const ok = await askConfirm(
    `${c.brightGreen}¿Correr deploy.sh completo en el servidor?${c.reset}`,
  );
  if (!ok) {
    console.log(`${c.dim}Cancelado.${c.reset}`);
    await waitEnter();
    return 1;
  }

  const remoteCmd = [
    `cd ${JSON.stringify(remotePath)}`,
    "bash scripts/deploy.sh",
  ].join(" && ");
  const code = run("ssh", [target, remoteCmd], GESTOR_ROOT);
  await waitEnter();
  return code;
}

function menuRows() {
  return [
    {
      id: "update-all",
      title: "★ Actualizar todo",
      desc: "pull todos → deploy gestor si cambió → 3 Vite → pm2 restart all.",
      color: "magenta",
      danger: "high",
    },
    {
      id: "git",
      title: "Git",
      desc: "pull/push → gestor, Raptor front, las 3 Vite u otra.",
      color: "magenta",
    },
    {
      id: "vite",
      title: "Vite / Raptor front",
      desc: "Compilar builds · git del repo raptor (fuente React).",
      color: "yellow",
      danger: "med",
    },
    {
      id: "db",
      title: "BD · scripts npm",
      desc: "db:sync, roles, backup… → las 3 o una.",
      color: "cyan",
      danger: "med",
    },
    {
      id: "deploy",
      title: "Deploy / PM2 · Raptor Solutions",
      desc: "Pull/deploy gestor · pm2 restart all o una app.",
      color: "cyan",
      danger: "med",
    },
    {
      id: "apps",
      title: "Apps · menús internos",
      desc: "Scripts propios de cada app (sin git; el git está arriba).",
      color: "white",
    },
    {
      id: "exit",
      title: "Salir",
      desc: "Cierra el hub.",
      kind: "exit",
      color: "red",
    },
  ];
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--update-all") || args.includes("update-all")) {
    const code = await fullSyncAndDeploy({
      confirm: !args.includes("--yes") && !args.includes("-y"),
    });
    process.exitCode = code;
    return;
  }

  while (true) {
    const row = await selectList(
      "Raptor Solutions",
      "Función primero → después el destino",
      menuRows(),
    );
    if (!row || row.id === "exit") {
      process.stdout.write(c.clear + c.show);
      console.log("Listo.");
      return;
    }
    if (row.id === "update-all") await fullSyncAndDeploy();
    else if (row.id === "git") await gitMenu();
    else if (row.id === "vite") await viteMenu();
    else if (row.id === "db") await dbMenu();
    else if (row.id === "deploy") await deployMenu();
    else if (row.id === "apps") await appsMenu();
  }
}

main().catch((err) => {
  process.stdout.write(c.show);
  console.error(err);
  process.exitCode = 1;
});
