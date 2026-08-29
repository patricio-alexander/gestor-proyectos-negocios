/**
 * Regenera eddeli-product-catalog.ts desde appModulesCatalog.js de EdDeli,
 * incluyendo status (active | development | maintenance | developer | planned).
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Fuente: frontend Raptor (hermano de este repo en AppsWeb/). */
const CATALOG_PATH = join(
  __dirname,
  "../../raptor/frontend/src/config/appModulesCatalog.js",
);
const OUT_PATH = join(
  __dirname,
  "../src/shared/config/eddeli-product-catalog.ts",
);

const {
  APP_MODULE_GROUPS,
  APP_ACCOUNT_SECTIONS = [],
  APP_PUBLIC_SECTIONS = [],
} = await import(pathToFileURL(CATALOG_PATH).href);

const STATUSES = new Set([
  "active",
  "development",
  "maintenance",
  "developer",
  "planned",
]);

const DEV_PREFIXES = ["/comprobantes-electronicos"];

function normalizeStatus(status) {
  if (status === "development") return "maintenance";
  if (STATUSES.has(status) && status !== "development") return status;
  return null;
}

function resolveSectionStatus(section) {
  const fromField = normalizeStatus(section?.status);
  if (fromField) return fromField;
  const path = String(section?.path || "").split("?")[0];
  if (DEV_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return "maintenance";
  }
  return "active";
}

function resolveGroupStatus(group) {
  const fromField = normalizeStatus(group?.status);
  if (fromField) return fromField;
  const sections = group.sections || [];
  if (sections.length === 0) return "planned";
  const operational = sections
    .map(resolveSectionStatus)
    .filter((s) => s !== "planned");
  if (operational.length === 0) return "planned";
  if (operational.some((s) => s === "active")) return "active";
  if (operational.some((s) => s === "maintenance")) return "maintenance";
  if (operational.some((s) => s === "developer")) return "developer";
  return "active";
}

function slugify(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

function capsFromFunctions(functions = []) {
  const used = new Set();
  const out = [];
  for (const fn of functions) {
    let code = slugify(fn.name) || "fn";
    let n = 2;
    while (used.has(code)) {
      code = `${slugify(fn.name)}_${n++}`.slice(0, 64);
    }
    used.add(code);
    out.push({ code, name: fn.name });
  }
  return out;
}

const KEY_MAP = {
  acceso: null, // split
  operacion: "operacion",
  ventas: "ventas",
  finanzas: "finanzas",
  inventario: "inventario",
  produccion: "produccion",
  documentos: "documentos",
  logistica: "logistica",
  comunidad: "comunidad",
  marketing: "marketing",
  admin: "administracion",
  sistema: "sistema",
  desarrollador: "desarrollador",
};

function sectionDef(sec, { alias = false, statusOverride } = {}) {
  const raw = String(sec.path || "");
  const key = raw.includes("?") ? raw.split("?")[0] : raw;
  if (!key || key.includes(":")) return null;
  const status = statusOverride || resolveSectionStatus(sec);
  const capabilities = alias ? undefined : capsFromFunctions(sec.functions);
  return {
    key,
    name: alias ? `${sec.name || key} (alias)` : sec.name,
    status,
    ...(capabilities?.length ? { capabilities } : {}),
  };
}

const modules = [];

for (const group of APP_MODULE_GROUPS) {
  const groupStatus = resolveGroupStatus(group);

  if (group.id === "acceso") {
    for (const sec of group.sections || []) {
      const path = String(sec.path || "").split("?")[0];
      if (path === "/") {
        modules.push({
          key: "dashboard",
          name: "Panel",
          description: sec.description || group.summary || "",
          status: "active",
          sections: [
            sectionDef(sec),
            { key: "/inicio", name: "Inicio (alias)", status: "active" },
            { key: "/backery", name: "Backery (alias)", status: "active" },
          ].filter(Boolean),
        });
      } else if (path === "/notifications") {
        modules.push({
          key: "notificaciones",
          name: "Notificaciones",
          description: sec.description || group.summary || "",
          status: "active",
          sections: [sectionDef(sec)].filter(Boolean),
        });
      }
    }
    continue;
  }

  const key = KEY_MAP[group.id];
  if (!key) continue;

  const seen = new Set();
  const sections = [];
  for (const sec of group.sections || []) {
    const def = sectionDef(sec);
    if (!def || seen.has(def.key)) continue;
    seen.add(def.key);
    sections.push(def);
  }

  // Alias extra
  const aliases = {
    operacion: [
      { key: "/comprobantes", name: "Comprobantes (redir)", status: "maintenance" },
      {
        key: "/sistema/facturacion-electronica",
        name: "Facturación electrónica (atajo)",
        status: "maintenance",
      },
      { key: "/facturacion/sri", name: "Config SRI (atajo)", status: "maintenance" },
    ],
    administracion: [
      { key: "/app-settings", name: "Ajustes de app", status: "active" },
    ],
    marketing: [
      {
        key: "/publicidad/campanas/nueva",
        name: "Nueva campaña",
        status: "maintenance",
      },
      { key: "/editor", name: "Editor (atajo)", status: "maintenance" },
      { key: "/publicity_edit", name: "Edición publicidad (atajo)", status: "maintenance" },
      { key: "/editorDefault", name: "Editor por defecto", status: "maintenance" },
      { key: "/templates", name: "Plantillas (atajo)", status: "maintenance" },
    ],
  };

  for (const a of aliases[key] || []) {
    if (!seen.has(a.key)) {
      seen.add(a.key);
      sections.push(a);
    }
  }

  if (key === "sistema") {
    for (const sec of APP_ACCOUNT_SECTIONS) {
      const def = sectionDef(sec);
      if (def && !seen.has(def.key)) {
        seen.add(def.key);
        sections.push(def);
      }
    }
  }

  if (key === "marketing") {
    for (const sec of APP_PUBLIC_SECTIONS) {
      const path = String(sec.path || "");
      if (path.startsWith("/tv")) {
        const def = sectionDef({ ...sec, path: "/tv" }, { statusOverride: "maintenance" });
        if (def && !seen.has(def.key)) {
          seen.add(def.key);
          sections.push(def);
        }
      } else if (path === "/catalogo" || path === "/punto_venta") {
        const def = sectionDef(sec);
        if (def && !seen.has(def.key)) {
          seen.add(def.key);
          sections.push(def);
        }
      }
    }
  }

  modules.push({
    key,
    name: group.label,
    description: group.summary || "",
    status: groupStatus,
    sections,
  });
}

function esc(s) {
  return JSON.stringify(s ?? "");
}

function renderCap(c) {
  return `{ code: ${esc(c.code)}, name: ${esc(c.name)} }`;
}

function renderSection(s) {
  const caps = s.capabilities?.length
    ? `,\n        capabilities: [\n          ${s.capabilities.map(renderCap).join(",\n          ")},\n        ]`
    : "";
  return `{
        key: ${esc(s.key)},
        name: ${esc(s.name)},
        status: ${esc(s.status)}${caps},
      }`;
}

function renderModule(m) {
  return `{
    key: ${esc(m.key)},
    name: ${esc(m.name)},
    description: ${esc(m.description)},
    status: ${esc(m.status)},
    sections: [
      ${m.sections.map(renderSection).join(",\n      ")},
    ],
  }`;
}

const items = modules.filter((m) =>
  ["dashboard", "notificaciones"].includes(m.key),
);
const groups = modules.filter(
  (m) => !["dashboard", "notificaciones"].includes(m.key),
);

const content = `/** Catálogo maestro EdDeli — generado desde appModulesCatalog.js (seed y control plane). */
export type LifecycleStatus =
  | "active"
  | "development"
  | "maintenance"
  | "developer"
  | "planned";

export type CatalogCapabilityDef = {
  /** Identificador estable para el cliente (ej. export_pdf, export_excel). */
  code: string;
  name: string;
};

export type CatalogSectionDef = {
  /** Ruta de la sección en EdDeli (link del menú). */
  key: string;
  name: string;
  status?: LifecycleStatus;
  capabilities?: CatalogCapabilityDef[];
};

export const DEFAULT_EXPORT_CAPABILITIES: CatalogCapabilityDef[] = [
  { code: "export_pdf", name: "Exportar PDF" },
  { code: "export_excel", name: "Exportar Excel" },
];

export type CatalogModuleDef = {
  key: string;
  name: string;
  description: string;
  status?: LifecycleStatus;
  sections: CatalogSectionDef[];
};

/** Ítems sueltos del menú: cada \`name\` es un módulo y su \`link\` es la sección. */
export const EDDELI_MENU_ITEMS: CatalogModuleDef[] = [
${items.map(renderModule).join(",\n")}
];

/** Grupos del menú: el \`label\` del grupo es el módulo; el \`link\` de cada ítem es la sección. */
export const EDDELI_MENU_GROUPS: CatalogModuleDef[] = [
${groups.map(renderModule).join(",\n")}
];

export const EDDELI_PRODUCT_CATALOG: CatalogModuleDef[] = [
  ...EDDELI_MENU_ITEMS,
  ...EDDELI_MENU_GROUPS,
];

export const DEFAULT_ROLES = [
  { key: "programador", name: "Programador", description: "Acceso total al gestor y catálogo." },
  { key: "admin", name: "Administrador", description: "Gestiona aplicaciones, planes y licencias." },
  { key: "operator", name: "Operador", description: "Consulta suscripciones y soporte básico." },
] as const;
`;

writeFileSync(OUT_PATH, content, "utf8");

const secCount = modules.reduce((n, m) => n + m.sections.length, 0);
const capCount = modules.reduce(
  (n, m) =>
    n +
    m.sections.reduce((a, s) => a + (s.capabilities?.length || 0), 0),
  0,
);
const byStatus = {};
for (const m of modules) {
  byStatus[m.status] = (byStatus[m.status] || 0) + 1;
}
console.log(
  JSON.stringify(
    {
      modules: modules.length,
      sections: secCount,
      capabilities: capCount,
      moduleStatus: byStatus,
    },
    null,
    2,
  ),
);
