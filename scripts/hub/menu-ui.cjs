/**
 * Menú TTY con flechas ↑↓, Enter y colores (estilo Scheduly / EdDeli).
 */
const readline = require("node:readline");

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
  brightCyan: "\x1b[96m",
  brightMagenta: "\x1b[95m",
  brightYellow: "\x1b[93m",
  brightGreen: "\x1b[92m",
  brightBlue: "\x1b[94m",
  bg: "\x1b[45m\x1b[97m\x1b[1m",
  clear: "\x1b[2J\x1b[H",
  hide: "\x1b[?25l",
  show: "\x1b[?25h",
};

const TONE = {
  cyan: c.brightCyan,
  green: c.brightGreen,
  yellow: c.brightYellow,
  magenta: c.brightMagenta,
  blue: c.brightBlue,
  red: c.red,
  white: c.white,
};

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function assertTty(appLabel) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(
      "Este menú necesita una terminal interactiva (TTY).\n" +
        `Abrí una terminal y corré: npm run script  (${appLabel})`,
    );
    process.exit(1);
  }
}

/**
 * @param {string} appLabel
 * @param {string} title
 * @param {Array<{ id: string, title: string, desc?: string, color?: string, danger?: 'low'|'med'|'high', kind?: string }>} rows
 * @returns {Promise<object|null>}
 */
function selectList(appLabel, title, rows) {
  assertTty(appLabel);
  let index = 0;

  const dangerBadge = (level) => {
    if (level === "high") return `${c.red}${c.bold}✖ PELIGRO${c.reset}`;
    if (level === "med") return `${c.yellow}${c.bold}◆ escribe${c.reset}`;
    return `${c.green}○ seguro${c.reset}`;
  };

  const render = () => {
    const lines = [];
    lines.push(
      `${c.brightMagenta}${c.bold}╔══════════════════════════════════════════╗${c.reset}`,
    );
    lines.push(
      `${c.brightMagenta}${c.bold}║${c.reset}  ${c.brightCyan}${c.bold}${appLabel}${c.reset} ${c.white}·${c.reset} ${c.brightYellow}${c.bold}Scripts Launcher${c.reset}          ${c.brightMagenta}${c.bold}║${c.reset}`,
    );
    lines.push(
      `${c.brightMagenta}${c.bold}╚══════════════════════════════════════════╝${c.reset}`,
    );
    lines.push(`${c.dim}${nowStamp()}${c.reset}`);
    lines.push(`${c.cyan}${title}${c.reset}`);
    lines.push(`${c.dim}↑↓ mover  ·  Enter elegir  ·  Esc / q salir${c.reset}`);
    lines.push("");

    rows.forEach((row, i) => {
      const selected = i === index;
      const pointer = selected ? `${c.bg} ❯ ${c.reset}` : "   ";
      const tone = TONE[row.color] || c.brightCyan;
      let label = `${tone}${row.title}${c.reset}`;
      if (row.kind === "exit") {
        label = `${c.red}Salir${c.reset}`;
      } else if (row.danger) {
        label = `${tone}${row.title}${c.reset}  ${dangerBadge(row.danger)}`;
      }
      lines.push(
        selected ? `${pointer}${c.bold}${label}${c.reset}` : `${pointer}${label}`,
      );
    });

    lines.push("");
    const cur = rows[index];
    if (cur?.desc) {
      lines.push(
        `${c.magenta}${c.dim}────────────────────────────────────────────${c.reset}`,
      );
      lines.push(`${c.dim}${cur.desc}${c.reset}`);
    }
    process.stdout.write(c.clear + c.hide + lines.join("\n") + "\n");
  };

  render();

  return new Promise((resolve) => {
    const onKey = (buf) => {
      const s = buf.toString("utf8");
      if (s === "\u0003" || s === "\u001b" || s === "q" || s === "Q") {
        cleanup();
        resolve(null);
        return;
      }
      if (s === "\u001b[A" || s === "k") {
        index = (index - 1 + rows.length) % rows.length;
        render();
        return;
      }
      if (s === "\u001b[B" || s === "j") {
        index = (index + 1) % rows.length;
        render();
        return;
      }
      if (s === "\r" || s === "\n") {
        cleanup();
        resolve(rows[index] ?? null);
      }
    };

    const cleanup = () => {
      process.stdin.off("data", onKey);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write(c.show);
    };

    process.stdin.resume();
    process.stdin.setRawMode(true);
    process.stdin.on("data", onKey);
  });
}

/** Tras selectList (raw mode + pause), hay que restaurar stdin para poder escribir. */
function prepareStdinForPrompt() {
  process.stdout.write(c.show);
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(false);
    } catch {
      /* ignore */
    }
  }
  if (typeof process.stdin.resume === "function") process.stdin.resume();
}

function askText(question, fallback = "") {
  prepareStdinForPrompt();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const hint = fallback ? ` ${c.dim}[${fallback}]${c.reset}` : "";
  return new Promise((resolve) => {
    rl.question(`${question}${hint}: `, (answer) => {
      rl.close();
      const v = String(answer || "").trim();
      resolve(v || fallback);
    });
  });
}

function askConfirm(question) {
  prepareStdinForPrompt();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${question} ${c.dim}[s/N]${c.reset} `, (answer) => {
      rl.close();
      const a = String(answer || "")
        .trim()
        .toLowerCase();
      resolve(a === "s" || a === "si" || a === "sí" || a === "y" || a === "yes");
    });
  });
}

function waitEnter(msg = "Enter para volver al menú…") {
  prepareStdinForPrompt();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`\n${c.dim}${msg}${c.reset} `, () => {
      rl.close();
      resolve();
    });
  });
}

module.exports = {
  c,
  selectList,
  askText,
  askConfirm,
  waitEnter,
  assertTty,
  nowStamp,
};
