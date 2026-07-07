/** Catálogo maestro EdDeli — fuente para seed y documentación del control plane. */
export type CatalogSectionDef = {
  /** Ruta de la sección en EdDeli (link del menú). */
  key: string;
  name: string;
};

export type CatalogModuleDef = {
  key: string;
  name: string;
  description: string;
  sections: CatalogSectionDef[];
};

/** Ítems sueltos del menú: cada `name` es un módulo y su `link` es la sección. */
export const EDDELI_MENU_ITEMS: CatalogModuleDef[] = [
  {
    key: "dashboard",
    name: "Dashboard",
    description: "Panel principal de EdDeli.",
    sections: [{ key: "/", name: "Dashboard" }],
  },
  {
    key: "notificaciones",
    name: "Notificaciones",
    description: "Centro de notificaciones del tenant.",
    sections: [{ key: "/notifications", name: "Notificaciones" }],
  },
];

/** Grupos del menú: el `label` del grupo es el módulo; el `link` de cada ítem es la sección. */
export const EDDELI_MENU_GROUPS: CatalogModuleDef[] = [
  {
    key: "operacion",
    name: "Operación",
    description: "Caja, turnos, tareas y supervisión operativa.",
    sections: [
      { key: "/caja", name: "Caja" },
      { key: "/turno", name: "Turno" },
      { key: "/tareas", name: "Tareas" },
      { key: "/facturacion", name: "Facturación" },
      { key: "/turno/supervision", name: "Supervisión caja" },
    ],
  },
  {
    key: "ventas",
    name: "Ventas",
    description: "Pedidos y clientes.",
    sections: [
      { key: "/inventory/orders", name: "Pedidos" },
      { key: "/inventory/customers", name: "Clientes" },
    ],
  },
  {
    key: "finanzas",
    name: "Finanzas",
    description: "Finanzas, cobranzas, deudas y gastos recurrentes.",
    sections: [
      { key: "/inventory/finance", name: "Finanzas" },
      { key: "/inventory/collections", name: "Cobranzas" },
      { key: "/inventory/prestamos-deudas", name: "Préstamos y deudas" },
      { key: "/inventory/gastos-recurrentes", name: "Gastos recurrentes" },
    ],
  },
  {
    key: "inventario",
    name: "Inventario",
    description: "Productos, movimientos, categorías, tramos y unidades.",
    sections: [
      { key: "/inventory/products", name: "Productos" },
      { key: "/inventory/movement", name: "Movimientos" },
      { key: "/inventory/categories", name: "Categorías" },
      { key: "/inventory/tramos", name: "Tramos" },
      { key: "/inventory/units", name: "Unidades" },
    ],
  },
  {
    key: "produccion",
    name: "Producción",
    description: "Insumos, recetas, producción y proveedores.",
    sections: [
      { key: "/inventory/insumos", name: "Insumos y marcas" },
      { key: "/inventory/recipes", name: "Recetas" },
      { key: "/inventory/production", name: "Producción" },
      { key: "/inventory/suppliers", name: "Proveedores" },
    ],
  },
  {
    key: "canal_digital",
    name: "Canal digital",
    description: "Catálogo web, puntos de venta y productos destacados.",
    sections: [
      { key: "/catalog_manager", name: "Catálogo config" },
      { key: "/inventory/puntos-venta", name: "Puntos de venta" },
      { key: "/inventory/productos-destacados", name: "Productos destacados" },
      { key: "/compare_groups", name: "Grupos comparativos" },
    ],
  },
  {
    key: "publicidad",
    name: "Publicidad",
    description: "Campañas TV, dispositivos y reproductor.",
    sections: [
      { key: "/publicidad", name: "Campañas" },
      { key: "/publicidad/dispositivos", name: "Dispositivos TV" },
      { key: "/publicidad/reproductor", name: "Reproductor" },
    ],
  },
  {
    key: "diseno_promocional",
    name: "Diseño promocional",
    description: "Editor, vista con productos y plantillas promocionales.",
    sections: [
      { key: "/diseno-promocional/editor", name: "Editor de diseño" },
      { key: "/diseno-promocional/vista", name: "Vista con productos" },
      { key: "/diseno-promocional/plantillas", name: "Plantillas" },
    ],
  },
  {
    key: "administracion",
    name: "Administración",
    description: "Usuarios, cuentas, roles y panel de control.",
    sections: [
      { key: "/users", name: "Usuarios" },
      { key: "/cuentas", name: "Cuentas" },
      { key: "/roles", name: "Roles" },
      { key: "/panel_control", name: "Panel de control" },
    ],
  },
  {
    key: "sistema",
    name: "Sistema",
    description: "Imágenes, archivos, logs, backups y comandos.",
    sections: [
      { key: "/img", name: "Imágenes" },
      { key: "/file", name: "Archivos" },
      { key: "/logs", name: "Logs" },
      { key: "/backups", name: "Backups JSON" },
      { key: "/comandos", name: "Comandos" },
    ],
  },
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
