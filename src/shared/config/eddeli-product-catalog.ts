/** Catálogo maestro EdDeli — fuente para seed y documentación del control plane. */
export type CatalogSectionDef = {
  key: string;
  name: string;
  route_path: string;
  description?: string;
};

export type CatalogModuleDef = {
  key: string;
  name: string;
  description: string;
  icon?: string;
  sections: CatalogSectionDef[];
};

export const EDDELI_PRODUCT_CATALOG: CatalogModuleDef[] = [
  {
    key: "workspace",
    name: "Workspace",
    description: "Perfil, notificaciones e información del usuario en EdDeli.",
    icon: "house",
    sections: [
      { key: "home", name: "Inicio", route_path: "/dashboard" },
      { key: "profile", name: "Perfil", route_path: "/dashboard/workspace/profile" },
      { key: "notifications", name: "Notificaciones", route_path: "/dashboard/workspace/notifications" },
      { key: "info", name: "Info", route_path: "/dashboard/workspace/info" },
      { key: "donations", name: "Donaciones", route_path: "/dashboard/workspace/donations" },
    ],
  },
  {
    key: "admin",
    name: "Administración",
    description: "Usuarios, cuentas, roles y programas del tenant EdDeli.",
    icon: "person",
    sections: [
      { key: "users", name: "Usuarios", route_path: "/dashboard/admin/users" },
      { key: "accounts", name: "Cuentas", route_path: "/dashboard/admin/accounts" },
      { key: "roles", name: "Roles", route_path: "/dashboard/admin/roles" },
      { key: "panel", name: "Panel de control", route_path: "/dashboard/admin/panel" },
      {
        key: "notification-programs",
        name: "Programas de notificación",
        route_path: "/dashboard/admin/notification-programs",
      },
    ],
  },
  {
    key: "store-ops",
    name: "Operaciones de tienda",
    description: "ERP, caja POS, turnos y tareas operativas.",
    icon: "briefcase",
    sections: [
      { key: "erp", name: "Dashboard ERP", route_path: "/dashboard/store-ops/erp" },
      { key: "pos", name: "Caja / POS", route_path: "/dashboard/store-ops/caja" },
      { key: "shifts", name: "Turnos", route_path: "/dashboard/store-ops/turno" },
      { key: "supervision", name: "Supervisión turnos", route_path: "/dashboard/store-ops/supervision" },
      { key: "tasks", name: "Tareas", route_path: "/dashboard/store-ops/tareas" },
    ],
  },
  {
    key: "inventory",
    name: "Inventario",
    description: "Productos, stock, movimientos y recetas.",
    icon: "boxes",
    sections: [
      { key: "products", name: "Productos", route_path: "/dashboard/inventory/products" },
      { key: "categories", name: "Categorías", route_path: "/dashboard/inventory/categories" },
      { key: "tier-groups", name: "Tramos", route_path: "/dashboard/inventory/tramos" },
      { key: "units", name: "Unidades", route_path: "/dashboard/inventory/units" },
      { key: "movements", name: "Movimientos", route_path: "/dashboard/inventory/movements" },
      { key: "supplies", name: "Insumos", route_path: "/dashboard/inventory/supplies" },
      { key: "recipes", name: "Recetas", route_path: "/dashboard/inventory/recipes" },
    ],
  },
  {
    key: "production",
    name: "Producción",
    description: "Producción, locales y productos destacados.",
    icon: "factory",
    sections: [
      { key: "manager", name: "Producción", route_path: "/dashboard/production/manager" },
      { key: "stores", name: "Puntos de venta", route_path: "/dashboard/production/stores" },
      { key: "featured", name: "Productos destacados", route_path: "/dashboard/production/featured" },
    ],
  },
  {
    key: "sales",
    name: "Ventas",
    description: "Pedidos, clientes y proveedores.",
    icon: "cart",
    sections: [
      { key: "orders", name: "Pedidos", route_path: "/dashboard/sales/orders" },
      { key: "customers", name: "Clientes", route_path: "/dashboard/sales/customers" },
      { key: "suppliers", name: "Proveedores", route_path: "/dashboard/sales/suppliers" },
    ],
  },
  {
    key: "finance",
    name: "Finanzas",
    description: "Resumen, cobranzas, deudas y facturación.",
    icon: "credit-card",
    sections: [
      { key: "overview", name: "Finanzas", route_path: "/dashboard/finance/overview" },
      { key: "collections", name: "Cobranzas", route_path: "/dashboard/finance/collections" },
      { key: "obligations", name: "Préstamos y deudas", route_path: "/dashboard/finance/loans-debts" },
      { key: "recurring", name: "Gastos recurrentes", route_path: "/dashboard/finance/recurring" },
      { key: "invoicing", name: "Facturación", route_path: "/dashboard/finance/invoicing" },
    ],
  },
  {
    key: "catalog",
    name: "Catálogo",
    description: "Catálogo público y gestor de productos en web.",
    icon: "layout-cells",
    sections: [
      { key: "public-catalog", name: "Catálogo público", route_path: "/catalogo" },
      { key: "public-stores", name: "Locales públicos", route_path: "/punto_venta" },
      { key: "manager", name: "Gestor catálogo", route_path: "/dashboard/catalog/manager" },
      { key: "compare-groups", name: "Grupos comparativos", route_path: "/dashboard/catalog/compare-groups" },
    ],
  },
  {
    key: "signage",
    name: "Señalización",
    description: "Campañas TV, dispositivos y reproductor.",
    icon: "tv",
    sections: [
      { key: "campaigns", name: "Campañas", route_path: "/dashboard/signage/campaigns" },
      { key: "devices", name: "Dispositivos", route_path: "/dashboard/signage/devices" },
      { key: "player", name: "Reproductor", route_path: "/dashboard/signage/player" },
    ],
  },
  {
    key: "creative",
    name: "Diseño creativo",
    description: "Editor, plantillas, imágenes y archivos.",
    icon: "pencil",
    sections: [
      { key: "editor", name: "Editor", route_path: "/dashboard/creative/editor" },
      { key: "templates", name: "Plantillas", route_path: "/dashboard/creative/templates" },
      { key: "product-view", name: "Vista productos", route_path: "/dashboard/creative/product-view" },
      { key: "images", name: "Gestor imágenes", route_path: "/dashboard/creative/images" },
      { key: "files", name: "Gestor archivos", route_path: "/dashboard/creative/files" },
    ],
  },
  {
    key: "platform",
    name: "Plataforma",
    description: "Comandos, backups JSON, logs y mantenimiento del tenant.",
    icon: "gear",
    sections: [
      { key: "commands", name: "Comandos", route_path: "/dashboard/platform/commands" },
      { key: "backups", name: "Backups", route_path: "/dashboard/platform/backups" },
      { key: "logs", name: "Logs", route_path: "/dashboard/platform/logs" },
    ],
  },
];

export const DEFAULT_ROLES = [
  { key: "programador", name: "Programador", description: "Acceso total al gestor y catálogo." },
  { key: "admin", name: "Administrador", description: "Gestiona aplicaciones, planes y licencias." },
  { key: "operator", name: "Operador", description: "Consulta suscripciones y soporte básico." },
] as const;
