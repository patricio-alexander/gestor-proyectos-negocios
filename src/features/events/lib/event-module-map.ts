/**
 * Clasifica eventos webhook existentes → módulo / sección del catálogo EdDeli.
 * Solo en el gestor; no requiere tracking nuevo en las apps.
 */

export type EventModuleHit = {
  module_key: string;
  module_name: string;
  section_key: string;
  section_name: string;
};

type Rule = {
  module_key: string;
  module_name: string;
  section_key: string;
  section_name: string;
  /** Prefijos de type_key (antes del primer punto), o type_key completo. */
  typePrefixes?: string[];
  /** Subcadenas en type_key. */
  typeIncludes?: string[];
  /** Prefijos de metadata.path (API). */
  pathPrefixes?: string[];
};

const RULES: Rule[] = [
  {
    module_key: "operacion",
    module_name: "Operación",
    section_key: "/operacion/caja",
    section_name: "Caja",
    typeIncludes: ["pos_checkout", "pos."],
    pathPrefixes: ["/orders/pos"],
  },
  {
    module_key: "operacion",
    module_name: "Operación",
    section_key: "/operacion/turno",
    section_name: "Turno",
    typePrefixes: ["shift"],
    pathPrefixes: ["/shifts"],
  },
  {
    module_key: "operacion",
    module_name: "Operación",
    section_key: "/operacion/tareas",
    section_name: "Tareas",
    typePrefixes: ["task", "task_plan", "task_item"],
    pathPrefixes: ["/tasks"],
  },
  {
    module_key: "operacion",
    module_name: "Operación",
    section_key: "/operacion/comprobantes-pos",
    section_name: "Comprobantes POS",
    typePrefixes: ["sri"],
    pathPrefixes: ["/sri"],
  },
  {
    module_key: "ventas",
    module_name: "Ventas y Compras",
    section_key: "/ventas/clientes",
    section_name: "Clientes",
    typePrefixes: ["customer"],
    pathPrefixes: ["/orders/customers"],
  },
  {
    module_key: "ventas",
    module_name: "Ventas y Compras",
    section_key: "/ventas/proveedores",
    section_name: "Proveedores",
    typePrefixes: ["supplier"],
    pathPrefixes: ["/orders/suppliers"],
  },
  {
    module_key: "ventas",
    module_name: "Ventas y Compras",
    section_key: "/ventas/compras",
    section_name: "Compras",
    typePrefixes: ["supplier_order", "supplier_payable"],
    pathPrefixes: ["/orders/supplier-orders"],
  },
  {
    module_key: "ventas",
    module_name: "Ventas y Compras",
    section_key: "/ventas/pedidos",
    section_name: "Pedidos",
    typePrefixes: ["order", "order_item", "orders"],
    pathPrefixes: ["/orders"],
  },
  {
    module_key: "finanzas",
    module_name: "Finanzas",
    section_key: "/finanzas/cobranzas",
    section_name: "Cobranzas",
    typePrefixes: ["workbench", "workbench_payment", "item_group"],
    typeIncludes: ["collection"],
    pathPrefixes: ["/finance/workbench", "/finance/collections"],
  },
  {
    module_key: "finanzas",
    module_name: "Finanzas",
    section_key: "/finanzas/prestamos-deudas",
    section_name: "Préstamos y deudas",
    typePrefixes: ["obligation"],
    pathPrefixes: ["/finance/obligations"],
  },
  {
    module_key: "finanzas",
    module_name: "Finanzas",
    section_key: "/finanzas/gastos-recurrentes",
    section_name: "Gastos recurrentes",
    typePrefixes: ["recurring"],
    pathPrefixes: ["/finance/recurring"],
  },
  {
    module_key: "finanzas",
    module_name: "Finanzas",
    section_key: "/finanzas/movimientos",
    section_name: "Movimientos",
    typePrefixes: ["income", "expense"],
    pathPrefixes: ["/finance"],
  },
  {
    module_key: "inventario",
    module_name: "Inventario",
    section_key: "/inventario/productos",
    section_name: "Productos",
    typePrefixes: ["product", "home_product", "presentation", "generic_ingredient"],
    pathPrefixes: ["/inventory/products", "/inventory/homeproducts", "/inventory/presentations"],
  },
  {
    module_key: "inventario",
    module_name: "Inventario",
    section_key: "/inventario/categorias",
    section_name: "Categorías",
    typePrefixes: ["category", "compare_group", "tier_group"],
    pathPrefixes: ["/inventory/categories", "/inventory/compare-groups", "/inventory/tier-groups"],
  },
  {
    module_key: "inventario",
    module_name: "Inventario",
    section_key: "/inventario/unidades",
    section_name: "Unidades",
    typePrefixes: ["unit"],
    pathPrefixes: ["/inventory/units"],
  },
  {
    module_key: "inventario",
    module_name: "Inventario",
    section_key: "/inventario/movimientos",
    section_name: "Movimientos",
    typePrefixes: ["movement"],
    pathPrefixes: ["/inventory/movements"],
  },
  {
    module_key: "inventario",
    module_name: "Inventario",
    section_key: "/inventario/bodegas",
    section_name: "Bodegas / locales",
    typePrefixes: ["store"],
    pathPrefixes: ["/inventory/stores"],
  },
  {
    module_key: "inventario",
    module_name: "Inventario",
    section_key: "/inventario/recetas",
    section_name: "Recetas",
    typePrefixes: ["recipe"],
    pathPrefixes: ["/inventory/recipes"],
  },
  {
    module_key: "inventario",
    module_name: "Inventario",
    section_key: "/inventario/catalogo",
    section_name: "Catálogo",
    typePrefixes: ["catalog_entry"],
    pathPrefixes: ["/inventory/catalog"],
  },
  {
    module_key: "marketing",
    module_name: "Marketing",
    section_key: "/marketing/publicidad",
    section_name: "Publicidad",
    typePrefixes: ["publicidad", "publicidad_device", "publicidad_campaign", "media"],
    pathPrefixes: ["/publicidad", "/media"],
  },
  {
    module_key: "documentos",
    module_name: "Documentos",
    section_key: "/documentos",
    section_name: "Documentos",
    typePrefixes: ["document", "editor", "editor_template", "editor_design"],
    pathPrefixes: ["/documents", "/editor"],
  },
  {
    module_key: "admin",
    module_name: "Administración",
    section_key: "/administracion/cuentas",
    section_name: "Cuentas / usuarios",
    typePrefixes: ["user", "account", "role"],
    pathPrefixes: ["/users", "/account", "/rol"],
  },
  {
    module_key: "acceso",
    module_name: "Acceso",
    section_key: "/sistema/notificaciones",
    section_name: "Notificaciones",
    typePrefixes: ["notification", "notification_program"],
    pathPrefixes: ["/notifications", "/notification-programs"],
  },
  {
    module_key: "acceso",
    module_name: "Acceso",
    section_key: "/login",
    section_name: "Sesión",
    typePrefixes: ["auth"],
    pathPrefixes: ["/login", "/changeRole"],
  },
  {
    module_key: "sistema",
    module_name: "Sistema",
    section_key: "/sistema/configuracion",
    section_name: "Configuración",
    typePrefixes: ["app", "subscription", "license"],
    pathPrefixes: ["/app", "/settings", "/subscription", "/license"],
  },
  {
    module_key: "sistema",
    module_name: "Sistema",
    section_key: "/sistema/backups",
    section_name: "Backups",
    typePrefixes: ["backup", "database"],
    pathPrefixes: ["/comands", "/backups"],
  },
  {
    module_key: "desarrollador",
    module_name: "Desarrollador",
    section_key: "/desarrollador/logs",
    section_name: "Logs",
    typePrefixes: ["log", "image", "file"],
    pathPrefixes: ["/logs", "/img", "/files"],
  },
];

function normalizePath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "";
  let p = raw.trim().split("?")[0] || "";
  try {
    if (p.startsWith("http")) p = new URL(p).pathname;
  } catch {
    /* ignore */
  }
  p = p.replace(/\/{2,}/g, "/");
  // Quitar prefijo API (eddeliapi, storeapi, …)
  const m = p.match(/^\/[^/]+api(\/.*)?$/i);
  if (m) p = m[1] || "/";
  if (!p.startsWith("/")) p = `/${p}`;
  return p;
}

function metaPath(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata) return "";
  return normalizePath(metadata.path ?? metadata.pathname ?? metadata.url);
}

function ruleMatches(rule: Rule, typeKey: string, path: string): boolean {
  const key = typeKey.toLowerCase();
  const prefix = key.split(".")[0] || key;

  if (rule.typeIncludes?.some((s) => key.includes(s.toLowerCase()))) return true;
  if (rule.typePrefixes?.some((p) => prefix === p.toLowerCase() || key === p.toLowerCase() || key.startsWith(`${p.toLowerCase()}.`))) {
    return true;
  }
  if (path && rule.pathPrefixes?.some((pp) => path === pp || path.startsWith(`${pp}/`))) {
    return true;
  }
  return false;
}

/** Resuelve módulo/sección para un evento ya ingestado. */
export function resolveEventModuleHit(
  typeKey: string | null | undefined,
  metadata?: Record<string, unknown> | null,
): EventModuleHit | null {
  const key = String(typeKey || "").trim().toLowerCase();
  if (!key) return null;
  // Fallidos se cuentan igual (actividad real); no filtrar aquí.

  const path = metaPath(metadata);

  // Preferir metadata explícita si ya viniera (compat).
  const mk = metadata && typeof metadata.module_key === "string" ? metadata.module_key.trim() : "";
  const sk = metadata && typeof metadata.section_key === "string" ? metadata.section_key.trim() : "";
  if (mk && sk) {
    return {
      module_key: mk,
      module_name:
        (typeof metadata?.module_name === "string" && metadata.module_name) || mk,
      section_key: sk,
      section_name:
        (typeof metadata?.section_name === "string" && metadata.section_name) || sk,
    };
  }

  for (const rule of RULES) {
    if (ruleMatches(rule, key, path)) {
      return {
        module_key: rule.module_key,
        module_name: rule.module_name,
        section_key: rule.section_key,
        section_name: rule.section_name,
      };
    }
  }

  return {
    module_key: "otros",
    module_name: "Otros",
    section_key: key.split(".")[0] || "desconocido",
    section_name: key.split(".")[0] || "Desconocido",
  };
}
