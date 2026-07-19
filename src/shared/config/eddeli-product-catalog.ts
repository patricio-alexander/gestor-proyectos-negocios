/** Catálogo maestro EdDeli — generado desde appModulesCatalog.js (seed y control plane). */
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

/** Ítems sueltos del menú: cada `name` es un módulo y su `link` es la sección. */
export const EDDELI_MENU_ITEMS: CatalogModuleDef[] = [
{
    key: "dashboard",
    name: "Dashboard",
    description: "Resumen del negocio: calendario financiero, clientes, ingresos por producto y gráficos. El rol Empleado no usa esta vista; se redirige a Caja.",
    status: "active",
    sections: [
      {
        key: "/",
        name: "Dashboard",
        status: "active",
        capabilities: [
          { code: "tarjetas_financieras", name: "Tarjetas financieras" },
          { code: "alertas_de_inventario", name: "Alertas de inventario" },
          { code: "ver_detalle_de_stock", name: "Ver detalle de stock" },
          { code: "grafico_ingresos_vs_gastos", name: "Gráfico ingresos vs gastos" },
          { code: "grafico_anual", name: "Gráfico anual" },
          { code: "estados_de_pedido", name: "Estados de pedido" },
          { code: "grafico_espejo_de_caja", name: "Gráfico espejo de caja" },
          { code: "grafico_de_velas", name: "Gráfico de velas" },
          { code: "calendario_financiero", name: "Calendario financiero" },
          { code: "detalle_del_dia", name: "Detalle del día" },
          { code: "ingresos_por_producto", name: "Ingresos por producto" },
          { code: "tabla_de_clientes", name: "Tabla de clientes" },
        ],
      },
    ],
  },
  {
    key: "info",
    name: "Información",
    description: "Documentación de la app y módulos.",
    status: "active",
    sections: [
      {
        key: "/info",
        name: "Información",
        status: "active",
        capabilities: [
          { code: "pestana_la_app", name: "Pestaña La app" },
          { code: "pestana_modulos", name: "Pestaña Módulos" },
          { code: "detalle_de_seccion", name: "Detalle de sección" },
          { code: "descargar_pdf", name: "Descargar PDF" },
        ],
      },
    ],
  }
];

/** Grupos del menú: el `label` del grupo es el módulo; el `link` de cada ítem es la sección. */
export const EDDELI_MENU_GROUPS: CatalogModuleDef[] = [
{
    key: "operacion",
    name: "Operación",
    description: "Punto de venta y trabajo diario en mostrador. (Próx.) multi-caja por local.",
    status: "active",
    sections: [
      {
        key: "/operacion/caja",
        name: "Caja",
        status: "active",
        capabilities: [
          { code: "escaner_de_codigo_de_barras", name: "Escáner de código de barras" },
          { code: "checkbox_mostrar_stock", name: "Checkbox «Mostrar stock»" },
          { code: "buscador_de_productos", name: "Buscador de productos" },
          { code: "accesos_rapidos", name: "Accesos rápidos" },
          { code: "edicion_del_carrito", name: "Edición del carrito" },
          { code: "panel_de_cobro", name: "Panel de cobro" },
          { code: "registrar_datos_del_cliente", name: "Registrar datos del cliente" },
          { code: "realizar_venta_cobrar", name: "Realizar venta / Cobrar" },
          { code: "ajuste_de_stock", name: "Ajuste de stock" },
          { code: "bajar_stock_en_sistema", name: "Bajar stock en sistema" },
          { code: "impresion_de_comprobante", name: "Impresión de comprobante" },
          { code: "indicador_de_turno", name: "Indicador de turno" },
        ],
      },
      {
        key: "/operacion/turno",
        name: "Turno",
        status: "active",
        capabilities: [
          { code: "apertura_de_turno", name: "Apertura de turno" },
          { code: "movimientos_de_caja", name: "Movimientos de caja" },
          { code: "compra_de_mercancia", name: "Compra de mercancía" },
          { code: "tabla_de_movimientos", name: "Tabla de movimientos" },
          { code: "cierre_con_arqueo", name: "Cierre con arqueo" },
          { code: "cerrar_turno", name: "Cerrar turno" },
          { code: "historial_de_turnos", name: "Historial de turnos" },
          { code: "edicion_programador", name: "Edición programador" },
          { code: "supervision_por_fecha", name: "Supervisión por fecha" },
        ],
      },
      {
        key: "/operacion/tareas",
        name: "Tareas",
        status: "active",
        capabilities: [
          { code: "vista_admin_planes", name: "Vista admin: planes" },
          { code: "nuevo_plan", name: "Nuevo plan" },
          { code: "editar_borrador", name: "Editar borrador" },
          { code: "eliminar_borrador", name: "Eliminar borrador" },
          { code: "configurar_tareas", name: "Configurar tareas" },
          { code: "accion_abrir_caja", name: "Acción abrir caja" },
          { code: "guardar_y_publicar", name: "Guardar y publicar" },
          { code: "vista_empleado", name: "Vista empleado" },
          { code: "check_quitar_check", name: "Check / Quitar check" },
          { code: "ejecutar_abrir_caja", name: "Ejecutar abrir caja" },
        ],
      },
      {
        key: "/operacion/comprobantes-pos",
        name: "Comprobantes POS",
        status: "active",
        capabilities: [
          { code: "historial_de_ventas_pos", name: "Historial de ventas POS" },
          { code: "busqueda_y_paginacion", name: "Búsqueda y paginación" },
          { code: "imprimir_por_venta", name: "Imprimir por venta" },
          { code: "formato_de_impresion", name: "Formato de impresión" },
        ],
      },
      {
        key: "/operacion/supervision-caja",
        name: "Supervisión caja",
        status: "active",
        capabilities: [
          { code: "navegacion_semanal", name: "Navegación semanal" },
          { code: "resumen_semanal", name: "Resumen semanal" },
          { code: "seleccion_de_dia", name: "Selección de día" },
          { code: "pestanas_gastos_ventas", name: "Pestañas Gastos / Ventas" },
          { code: "acordeones_de_ventas", name: "Acordeones de ventas" },
          { code: "turnos_del_dia", name: "Turnos del día" },
        ],
      },
      {
        key: "/operacion/turno/multi-caja",
        name: "Apertura multi-caja por local",
        status: "planned",
        capabilities: [
          { code: "seleccionar_caja_del_local", name: "Seleccionar caja del local" },
          { code: "turnos_paralelos", name: "Turnos paralelos" },
          { code: "indicador_multi_caja", name: "Indicador multi-caja" },
          { code: "supervision_por_caja", name: "Supervisión por caja" },
        ],
      },
    ],
  },
{
    key: "comprobantes_electronicos",
    name: "Comprobantes electrónicos",
    description: "Documentos tributarios SRI: facturas, notas, retenciones y guías.",
    status: "maintenance",
    sections: [
      {
        key: "/comprobantes-electronicos",
        name: "Inicio SRI",
        status: "maintenance",
        capabilities: [
          { code: "panel_de_secciones", name: "Panel de secciones" },
          { code: "atajos", name: "Atajos" },
        ],
      },
      {
        key: "/comprobantes-electronicos/facturas",
        name: "Facturas",
        status: "maintenance",
        capabilities: [
          { code: "bandeja_prox", name: "Bandeja (próx.)" },
        ],
      },
      {
        key: "/comprobantes-electronicos/notas-venta",
        name: "Notas de venta",
        status: "maintenance",
        capabilities: [
          { code: "bandeja_prox", name: "Bandeja (próx.)" },
        ],
      },
      {
        key: "/comprobantes-electronicos/notas-credito",
        name: "Notas de crédito",
        status: "maintenance",
        capabilities: [
          { code: "bandeja_prox", name: "Bandeja (próx.)" },
        ],
      },
      {
        key: "/comprobantes-electronicos/notas-debito",
        name: "Notas de débito",
        status: "maintenance",
        capabilities: [
          { code: "bandeja_prox", name: "Bandeja (próx.)" },
        ],
      },
      {
        key: "/comprobantes-electronicos/retenciones",
        name: "Retenciones",
        status: "maintenance",
        capabilities: [
          { code: "bandeja_prox", name: "Bandeja (próx.)" },
        ],
      },
      {
        key: "/comprobantes-electronicos/guias-remision",
        name: "Guías de remisión",
        status: "maintenance",
        capabilities: [
          { code: "bandeja_prox", name: "Bandeja (próx.)" },
        ],
      },
      {
        key: "/comprobantes-electronicos/liquidacion-compras",
        name: "Liquidación de compras",
        status: "maintenance",
        capabilities: [
          { code: "bandeja_prox", name: "Bandeja (próx.)" },
        ],
      },
      {
        key: "/comprobantes-electronicos/emitidos",
        name: "Documentos emitidos",
        status: "maintenance",
        capabilities: [
          { code: "bandeja_prox", name: "Bandeja (próx.)" },
        ],
      },
    ],
  },
{
    key: "ventas",
    name: "Ventas",
    description: "Pedidos institucionales, clientes mayoristas y (próx.) clientes con cuenta.",
    status: "active",
    sections: [
      {
        key: "/ventas/pedidos",
        name: "Pedidos",
        status: "active",
        capabilities: [
          { code: "crear_pedido_cliente", name: "Crear pedido cliente" },
          { code: "pedido_a_proveedor", name: "Pedido a proveedor" },
          { code: "calendario_mensual", name: "Calendario mensual" },
          { code: "filtro_por_tipo", name: "Filtro por tipo" },
          { code: "detalle_por_dia", name: "Detalle por día" },
          { code: "marcar_pagado_entregado", name: "Marcar pagado/entregado" },
          { code: "editar_eliminar_item", name: "Editar/eliminar ítem" },
          { code: "recibo_firmado", name: "Recibo firmado" },
          { code: "proveedor_recibido_pagado", name: "Proveedor: recibido/pagado" },
        ],
      },
      {
        key: "/ventas/clientes",
        name: "Clientes",
        status: "active",
        capabilities: [
          { code: "agregar_cliente", name: "Agregar cliente" },
          { code: "tabla_con_busqueda", name: "Tabla con búsqueda" },
          { code: "editar_cliente", name: "Editar cliente" },
          { code: "eliminar_cliente", name: "Eliminar cliente" },
        ],
      },
      {
        key: "/ventas/clientes/cuentas",
        name: "Clientes con cuenta",
        status: "planned",
        capabilities: [
          { code: "vincular_cuenta", name: "Vincular cuenta" },
          { code: "permisos_de_cliente", name: "Permisos de cliente" },
          { code: "portal_vistas_cliente", name: "Portal / vistas cliente" },
        ],
      },
    ],
  },
{
    key: "finanzas",
    name: "Finanzas",
    description: "Ingresos, cobros, gastos y cuentas por pagar a proveedores.",
    status: "active",
    sections: [
      {
        key: "/finanzas/movimientos",
        name: "Finanzas",
        status: "active",
        capabilities: [
          { code: "tarjetas_resumen", name: "Tarjetas resumen" },
          { code: "tabla_unificada", name: "Tabla unificada" },
          { code: "filtro_por_tipo", name: "Filtro por tipo" },
          { code: "filtro_por_categoria", name: "Filtro por categoría" },
          { code: "registrar_ingreso_gasto", name: "Registrar ingreso/gasto" },
          { code: "ir_a_cobranzas", name: "Ir a Cobranzas" },
        ],
      },
      {
        key: "/finanzas/cobranzas",
        name: "Cobranzas",
        status: "active",
        capabilities: [
          { code: "modo_clientes_proveedores", name: "Modo Clientes / Proveedores" },
          { code: "abonar_pedido_de_cliente", name: "Abonar pedido de cliente" },
          { code: "abonar_pedido_de_proveedor", name: "Abonar pedido de proveedor" },
          { code: "selector_por_deuda", name: "Selector por deuda" },
          { code: "grupos_y_abonos_clientes", name: "Grupos y abonos (clientes)" },
          { code: "resumen_de_cuenta", name: "Resumen de cuenta" },
        ],
      },
      {
        key: "/finanzas/prestamos-deudas",
        name: "Préstamos y deudas",
        status: "active",
        capabilities: [
          { code: "nuevo_prestamo_deuda", name: "Nuevo préstamo/deuda" },
          { code: "filtros", name: "Filtros" },
          { code: "ver_detalle", name: "Ver detalle" },
          { code: "registrar_cobro_pago", name: "Registrar cobro/pago" },
          { code: "anular_obligacion", name: "Anular obligación" },
        ],
      },
      {
        key: "/finanzas/gastos-recurrentes",
        name: "Gastos recurrentes",
        status: "maintenance",
        capabilities: [
          { code: "generar_cuotas", name: "Generar cuotas" },
          { code: "nueva_plantilla", name: "Nueva plantilla" },
          { code: "cuotas_del_mes", name: "Cuotas del mes" },
          { code: "ajustar_monto_variable", name: "Ajustar monto variable" },
          { code: "registrar_pago", name: "Registrar pago" },
          { code: "omitir_periodo", name: "Omitir período" },
        ],
      },
    ],
  },
{
    key: "inventario",
    name: "Inventario",
    description: "Catálogo, stock, (próx.) bodegas y lotes/vencimientos.",
    status: "active",
    sections: [
      {
        key: "/inventario/productos",
        name: "Productos",
        status: "active",
        capabilities: [
          { code: "vista_tarjetas_tabla", name: "Vista tarjetas / tabla" },
          { code: "busqueda_y_escaneo", name: "Búsqueda y escaneo" },
          { code: "crear_editar_producto", name: "Crear/editar producto" },
          { code: "ajuste_rapido_de_stock", name: "Ajuste rápido de stock" },
          { code: "duplicar_producto", name: "Duplicar producto" },
        ],
      },
      {
        key: "/inventario/movimientos",
        name: "Movimientos",
        status: "active",
        capabilities: [
          { code: "registrar_movimiento", name: "Registrar movimiento" },
          { code: "carrito_multi_linea", name: "Carrito multi-línea" },
          { code: "produccion_integrada", name: "Producción integrada" },
          { code: "comprobante_adjunto", name: "Comprobante adjunto" },
          { code: "editar_eliminar_programador", name: "Editar/eliminar (Programador)" },
          { code: "historial_agrupado", name: "Historial agrupado" },
        ],
      },
      {
        key: "/inventario/categorias",
        name: "Categorías",
        status: "active",
        capabilities: [
          { code: "panel_maestro_detalle", name: "Panel maestro-detalle" },
          { code: "busqueda", name: "Búsqueda" },
          { code: "crud_categorias", name: "CRUD categorías" },
          { code: "visibilidad_publica", name: "Visibilidad pública" },
        ],
      },
      {
        key: "/inventario/tramos",
        name: "Tramos",
        status: "active",
        capabilities: [
          { code: "grupos_de_tramos", name: "Grupos de tramos" },
          { code: "crear_editar_grupo", name: "Crear/editar grupo" },
          { code: "migrar_desde_categorias", name: "Migrar desde categorías" },
          { code: "estado_activo_inactivo", name: "Estado activo/inactivo" },
        ],
      },
      {
        key: "/inventario/unidades",
        name: "Unidades",
        status: "active",
        capabilities: [
          { code: "crud_de_unidades", name: "CRUD de unidades" },
          { code: "tabla_de_unidades", name: "Tabla de unidades" },
        ],
      },
      {
        key: "/inventario/bodegas",
        name: "Bodegas",
        status: "planned",
        capabilities: [
          { code: "crear_bodega", name: "Crear bodega" },
          { code: "inventario_por_bodega", name: "Inventario por bodega" },
          { code: "transferencias", name: "Transferencias" },
          { code: "movimientos_de_bodega", name: "Movimientos de bodega" },
        ],
      },
      {
        key: "/inventario/lotes",
        name: "Lotes y vencimientos",
        status: "planned",
        capabilities: [
          { code: "registrar_lote", name: "Registrar lote" },
          { code: "stock_por_lote", name: "Stock por lote" },
          { code: "alertas_de_vencimiento", name: "Alertas de vencimiento" },
          { code: "salida_por_fefo_fifo", name: "Salida por FEFO/FIFO" },
        ],
      },
    ],
  },
{
    key: "produccion",
    name: "Producción",
    description: "Insumos, recetas, fabricación y (próx.) proveedores con cuenta.",
    status: "active",
    sections: [
      {
        key: "/produccion/insumos",
        name: "Insumos y marcas",
        status: "active",
        capabilities: [
          { code: "panel_de_insumos_genericos", name: "Panel de insumos genéricos" },
          { code: "crear_presentacion", name: "Crear presentación" },
          { code: "enlazar_producto", name: "Enlazar producto" },
          { code: "bootstrap_frecuentes", name: "Bootstrap frecuentes" },
          { code: "materia_prima_sin_enlazar", name: "Materia prima sin enlazar" },
        ],
      },
      {
        key: "/produccion/recetas",
        name: "Recetas",
        status: "active",
        capabilities: [
          { code: "selector_de_producto", name: "Selector de producto" },
          { code: "gestion_de_componentes", name: "Gestión de componentes" },
          { code: "parametros_de_costeo", name: "Parámetros de costeo" },
          { code: "resumen_de_costo", name: "Resumen de costo" },
          { code: "rentabilidad", name: "Rentabilidad" },
          { code: "arbol_de_costos", name: "Árbol de costos" },
        ],
      },
      {
        key: "/produccion/fabricacion",
        name: "Producción",
        status: "active",
        capabilities: [
          { code: "ajuste_de_stock_inline", name: "Ajuste de stock inline" },
          { code: "producir_producto_final", name: "Producir producto final" },
          { code: "producir_intermedio", name: "Producir intermedio" },
          { code: "fecha_personalizada", name: "Fecha personalizada" },
        ],
      },
      {
        key: "/produccion/proveedores",
        name: "Proveedores",
        status: "active",
        capabilities: [
          { code: "crud_proveedores", name: "CRUD proveedores" },
          { code: "tabla_paginada", name: "Tabla paginada" },
        ],
      },
      {
        key: "/produccion/proveedores/cuentas",
        name: "Proveedores con cuenta",
        status: "planned",
        capabilities: [
          { code: "vincular_cuenta", name: "Vincular cuenta" },
          { code: "permisos_de_proveedor", name: "Permisos de proveedor" },
          { code: "portal_vistas_proveedor", name: "Portal / vistas proveedor" },
        ],
      },
    ],
  },
{
    key: "canal",
    name: "Canal",
    description: "Catálogo web y vitrina pública.",
    status: "active",
    sections: [
      {
        key: "/canal/catalogo",
        name: "Catálogo config",
        status: "active",
        capabilities: [
          { code: "entradas_por_seccion", name: "Entradas por sección" },
          { code: "crear_editar_entrada", name: "Crear/editar entrada" },
          { code: "reglas_mayoristas", name: "Reglas mayoristas" },
          { code: "autocataloglab", name: "AutoCatalogLab" },
        ],
      },
      {
        key: "/canal/locales",
        name: "Puntos de venta",
        status: "active",
        capabilities: [
          { code: "crud_tiendas", name: "CRUD tiendas" },
          { code: "filtro_por_tipo", name: "Filtro por tipo" },
          { code: "codigos_sri", name: "Códigos SRI" },
          { code: "ubicacion_en_mapa", name: "Ubicación en mapa" },
          { code: "imagen_con_recorte", name: "Imagen con recorte" },
          { code: "productos_por_tienda", name: "Productos por tienda" },
        ],
      },
      {
        key: "/canal/productos-destacados",
        name: "Productos destacados",
        status: "maintenance",
        capabilities: [
          { code: "crud_destacados", name: "CRUD destacados" },
          { code: "imagen_con_cropper", name: "Imagen con cropper" },
          { code: "vincular_producto", name: "Vincular producto" },
        ],
      },
      {
        key: "/canal/grupos-comparativos",
        name: "Grupos comparativos",
        status: "maintenance",
        capabilities: [
          { code: "matriz_de_celdas", name: "Matriz de celdas" },
          { code: "rellenos_con_colores", name: "Rellenos con colores" },
          { code: "vista_previa_en_vivo", name: "Vista previa en vivo" },
          { code: "bootstrap_pasteles", name: "Bootstrap Pasteles" },
        ],
      },
    ],
  },
{
    key: "publico",
    name: "Público",
    description: "Vitrina y locales visibles para clientes.",
    status: "active",
    sections: [
      {
        key: "/publico/catalogo",
        name: "Catálogo público",
        status: "active",
        capabilities: [
          { code: "secciones_de_catalogo", name: "Secciones de catálogo" },
          { code: "busqueda_y_filtros", name: "Búsqueda y filtros" },
          { code: "grupos_comparativos", name: "Grupos comparativos" },
          { code: "vista_previa_modal", name: "Vista previa modal" },
        ],
      },
      {
        key: "/publico/locales",
        name: "Locales",
        status: "active",
        capabilities: [
          { code: "filtro_por_tipo", name: "Filtro por tipo" },
          { code: "listado_de_locales", name: "Listado de locales" },
          { code: "detalle_de_local", name: "Detalle de local" },
          { code: "productos_del_local", name: "Productos del local" },
        ],
      },
    ],
  },
{
    key: "documentos",
    name: "Documentos",
    description: "Plantillas, contratos, firmas y archivo documental. Próximamente: aún no hay pantallas activas.",
    status: "planned",
    sections: [
      {
        key: "/documentos/plantillas",
        name: "Plantillas",
        status: "planned",
        capabilities: [
          { code: "crud_plantillas", name: "CRUD plantillas" },
          { code: "variables", name: "Variables" },
          { code: "vista_previa", name: "Vista previa" },
        ],
      },
      {
        key: "/documentos/contratos",
        name: "Contratos",
        status: "planned",
        capabilities: [
          { code: "crear_contrato", name: "Crear contrato" },
          { code: "estados", name: "Estados" },
          { code: "vencimientos", name: "Vencimientos" },
        ],
      },
      {
        key: "/documentos/firmas",
        name: "Firmas",
        status: "planned",
        capabilities: [
          { code: "solicitar_firma", name: "Solicitar firma" },
          { code: "firmar", name: "Firmar" },
          { code: "historial_de_firmas", name: "Historial de firmas" },
        ],
      },
      {
        key: "/documentos/archivo",
        name: "Archivo",
        status: "planned",
        capabilities: [
          { code: "explorar_archivo", name: "Explorar archivo" },
          { code: "subir_documento", name: "Subir documento" },
          { code: "descargar_compartir", name: "Descargar / compartir" },
        ],
      },
    ],
  },
{
    key: "logistica",
    name: "Logística",
    description: "Rutas, transportistas, entregas y tracking. Próximamente: aún no hay pantallas activas.",
    status: "planned",
    sections: [
      {
        key: "/logistica/rutas",
        name: "Rutas",
        status: "planned",
        capabilities: [
          { code: "crud_de_rutas", name: "CRUD de rutas" },
          { code: "paradas", name: "Paradas" },
          { code: "asignar_transportista", name: "Asignar transportista" },
        ],
      },
      {
        key: "/logistica/transportistas",
        name: "Transportistas",
        status: "planned",
        capabilities: [
          { code: "crud_transportistas", name: "CRUD transportistas" },
          { code: "disponibilidad", name: "Disponibilidad" },
          { code: "vinculo_con_cuenta", name: "Vínculo con cuenta" },
        ],
      },
      {
        key: "/logistica/entregas",
        name: "Entregas",
        status: "planned",
        capabilities: [
          { code: "crear_entrega", name: "Crear entrega" },
          { code: "estados_de_entrega", name: "Estados de entrega" },
          { code: "evidencia", name: "Evidencia" },
        ],
      },
      {
        key: "/logistica/tracking",
        name: "Tracking",
        status: "planned",
        capabilities: [
          { code: "mapa_estado_en_ruta", name: "Mapa / estado en ruta" },
          { code: "historial", name: "Historial" },
          { code: "alertas", name: "Alertas" },
        ],
      },
    ],
  },
{
    key: "comunidad",
    name: "Comunidad",
    description: "Encuestas, quejas y resultados de participación. Próximamente: aún no hay pantallas activas.",
    status: "planned",
    sections: [
      {
        key: "/comunidad/encuestas",
        name: "Encuestas",
        status: "planned",
        capabilities: [
          { code: "crear_encuesta", name: "Crear encuesta" },
          { code: "responder_encuesta", name: "Responder encuesta" },
          { code: "encuesta_de_mejoras", name: "Encuesta de mejoras" },
        ],
      },
      {
        key: "/comunidad/quejas",
        name: "Quejas",
        status: "planned",
        capabilities: [
          { code: "registrar_queja", name: "Registrar queja" },
          { code: "bandeja_admin", name: "Bandeja admin" },
          { code: "respuesta_cierre", name: "Respuesta / cierre" },
        ],
      },
      {
        key: "/comunidad/resultados",
        name: "Resultados",
        status: "planned",
        capabilities: [
          { code: "resumen_de_encuestas", name: "Resumen de encuestas" },
          { code: "exportar", name: "Exportar" },
          { code: "filtros", name: "Filtros" },
        ],
      },
    ],
  },
{
    key: "publicidad",
    name: "Publicidad",
    description: "Señalización digital en pantallas TV. En mantenimiento: no se usa en producción y requiere mejora.",
    status: "maintenance",
    sections: [
      {
        key: "/publicidad",
        name: "Campañas",
        status: "active",
        capabilities: [
          { code: "listado_de_campanas", name: "Listado de campañas" },
          { code: "nueva_editar_campana", name: "Nueva/editar campaña" },
          { code: "vista_previa_reproductor", name: "Vista previa reproductor" },
          { code: "eliminar_campana", name: "Eliminar campaña" },
        ],
      },
      {
        key: "/publicidad/dispositivos",
        name: "Dispositivos TV",
        status: "active",
        capabilities: [
          { code: "aprobacion_de_dispositivos", name: "Aprobación de dispositivos" },
          { code: "asignar_campana", name: "Asignar campaña" },
          { code: "abrir_reproductor_tv", name: "Abrir reproductor TV" },
          { code: "eliminar_registro", name: "Eliminar registro" },
        ],
      },
      {
        key: "/publicidad/reproductor",
        name: "Reproductor",
        status: "active",
        capabilities: [
          { code: "reproduccion_fullscreen", name: "Reproducción fullscreen" },
          { code: "sync_en_tiempo_real", name: "Sync en tiempo real" },
          { code: "modo_offline", name: "Modo offline" },
          { code: "musica_de_fondo", name: "Música de fondo" },
        ],
      },
      {
        key: "/publicidad/campanas/nueva",
        name: "Nueva campaña",
        status: "maintenance",
      },
      {
        key: "/publicidad/campanas/:id",
        name: "Editar campaña",
        status: "maintenance",
      },
    ],
  },
{
    key: "diseno_promocional",
    name: "Diseño promocional",
    description: "Editor gráfico del sistema. En mantenimiento: no se usa en producción y requiere mejora.",
    status: "maintenance",
    sections: [
      {
        key: "/diseno-promocional/editor",
        name: "Editor de diseño",
        status: "active",
        capabilities: [
          { code: "canvas_de_diseno", name: "Canvas de diseño" },
          { code: "capas", name: "Capas" },
          { code: "inspector", name: "Inspector" },
          { code: "selector_de_productos", name: "Selector de productos" },
          { code: "exportar", name: "Exportar" },
          { code: "abrir_plantilla_por_id", name: "Abrir plantilla por ID" },
        ],
      },
      {
        key: "/diseno-promocional/vista",
        name: "Vista con productos",
        status: "active",
        capabilities: [
          { code: "estudio_de_producto", name: "Estudio de producto" },
          { code: "canvas_en_vivo", name: "Canvas en vivo" },
          { code: "toolbar", name: "Toolbar" },
        ],
      },
      {
        key: "/diseno-promocional/plantillas",
        name: "Plantillas",
        status: "active",
        capabilities: [
          { code: "listado_de_plantillas", name: "Listado de plantillas" },
          { code: "crear_plantilla", name: "Crear plantilla" },
          { code: "importar_exportar", name: "Importar/exportar" },
          { code: "duplicar_y_eliminar", name: "Duplicar y eliminar" },
          { code: "abrir_en_editor", name: "Abrir en editor" },
        ],
      },
    ],
  },
{
    key: "administracion",
    name: "Administración",
    description: "Usuarios, permisos, panel y (próx.) asistencia / horarios del personal.",
    status: "active",
    sections: [
      {
        key: "/administracion/usuarios",
        name: "Usuarios",
        status: "active",
        capabilities: [
          { code: "listado_de_usuarios", name: "Listado de usuarios" },
          { code: "crear_usuario", name: "Crear usuario" },
          { code: "editar_usuario", name: "Editar usuario" },
        ],
      },
      {
        key: "/administracion/cuentas",
        name: "Cuentas",
        status: "active",
        capabilities: [
          { code: "listado_de_cuentas", name: "Listado de cuentas" },
          { code: "crear_editar_cuenta", name: "Crear/editar cuenta" },
          { code: "resetear_contrasena", name: "Resetear contraseña" },
          { code: "eliminar_cuenta", name: "Eliminar cuenta" },
        ],
      },
      {
        key: "/administracion/roles",
        name: "Roles",
        status: "active",
        capabilities: [
          { code: "crear_rol", name: "Crear rol" },
          { code: "editar_rol", name: "Editar rol" },
          { code: "eliminar_rol", name: "Eliminar rol" },
        ],
      },
      {
        key: "/administracion/panel-control",
        name: "Panel de control",
        status: "active",
        capabilities: [
          { code: "estadisticas_del_sistema", name: "Estadísticas del sistema" },
          { code: "info_ultimo_backup", name: "Info último backup" },
          { code: "guardar_copia_en_servidor", name: "Guardar copia en servidor" },
          { code: "descargar_copia", name: "Descargar copia" },
        ],
      },
      {
        key: "/administracion/programas-notificacion",
        name: "Programas de notificación",
        status: "active",
        capabilities: [
          { code: "crud_plantillas", name: "CRUD plantillas" },
          { code: "programacion", name: "Programación" },
          { code: "destinatarios_por_rol", name: "Destinatarios por rol" },
          { code: "enviar_ahora", name: "Enviar ahora" },
        ],
      },
      {
        key: "/admin/asistencia",
        name: "Asistencia / horarios del personal",
        status: "planned",
        capabilities: [
          { code: "marcar_asistencia", name: "Marcar asistencia" },
          { code: "horarios_turnos_laborales", name: "Horarios / turnos laborales" },
          { code: "historial_y_reportes", name: "Historial y reportes" },
          { code: "vinculo_con_usuarios", name: "Vinculo con usuarios" },
        ],
      },
    ],
  },
{
    key: "sistema",
    name: "Sistema",
    description: "Configuración del negocio, planes, mapa de módulos, perfil y donaciones.",
    status: "active",
    sections: [
      {
        key: "/sistema/configuracion",
        name: "Configuración",
        status: "active",
        capabilities: [
          { code: "pestana_negocio_y_app", name: "Pestaña Negocio y app" },
          { code: "pestana_facturacion_electronica", name: "Pestaña Facturación electrónica" },
          { code: "subir_cambiar_logo", name: "Subir / cambiar logo" },
          { code: "zona_horaria", name: "Zona horaria" },
          { code: "firma_sri", name: "Firma SRI" },
        ],
      },
      {
        key: "/sistema/notificaciones",
        name: "Notificaciones",
        status: "active",
        capabilities: [
          { code: "pestanas_admin", name: "Pestañas admin" },
          { code: "filtro_leidas", name: "Filtro leídas" },
          { code: "menu_por_notificacion", name: "Menú por notificación" },
          { code: "marcar_todas_leidas", name: "Marcar todas leídas" },
          { code: "navegacion_por_enlace", name: "Navegación por enlace" },
        ],
      },
      {
        key: "/sistema/planes",
        name: "Planes",
        status: "active",
        capabilities: [
          { code: "plan_prueba", name: "Plan Prueba" },
          { code: "plan_basico", name: "Plan Básico" },
          { code: "plan_medio", name: "Plan Medio" },
          { code: "plan_pro", name: "Plan Pro" },
          { code: "plan_socios", name: "Plan Socios" },
          { code: "plan_empresarial", name: "Plan Empresarial" },
          { code: "comparar_planes", name: "Comparar planes" },
        ],
      },
      {
        key: "/sistema/modulos",
        name: "Módulos",
        status: "active",
        capabilities: [
          { code: "tarjetas_por_modulo", name: "Tarjetas por módulo" },
          { code: "filtro_por_estado", name: "Filtro por estado" },
          { code: "ir_al_modulo", name: "Ir al módulo" },
        ],
      },
      {
        key: "/sistema/perfil",
        name: "Perfil",
        status: "active",
        capabilities: [
          { code: "editar_datos_personales", name: "Editar datos personales" },
          { code: "cambiar_contrasena", name: "Cambiar contraseña" },
        ],
      },
      {
        key: "/sistema/donaciones",
        name: "Donaciones",
        status: "active",
        capabilities: [
          { code: "informacion_de_apoyo", name: "Información de apoyo" },
        ],
      },
    ],
  },
{
    key: "desarrollador",
    name: "Desarrollador",
    description: "Herramientas técnicas del rol Programador (futuro: Desarrollador). El cliente debe saber que existe; en producción del negocio no forma parte del uso diario.",
    status: "developer",
    sections: [
      {
        key: "/desarrollador/imagenes",
        name: "Imágenes",
        status: "active",
        capabilities: [
          { code: "escaneo_de_carpeta", name: "Escaneo de carpeta" },
          { code: "subir_eliminar_imagen", name: "Subir/eliminar imagen" },
          { code: "descargar_zip", name: "Descargar ZIP" },
        ],
      },
      {
        key: "/desarrollador/archivos",
        name: "Archivos",
        status: "active",
        capabilities: [
          { code: "explorar_archivos", name: "Explorar archivos" },
          { code: "subir_reemplazar", name: "Subir/reemplazar" },
          { code: "descargar_zip_de_carpeta", name: "Descargar ZIP de carpeta" },
          { code: "eliminar_carpeta", name: "Eliminar carpeta" },
        ],
      },
      {
        key: "/desarrollador/logs",
        name: "Logs",
        status: "active",
        capabilities: [
          { code: "tabla_de_logs_http", name: "Tabla de logs HTTP" },
          { code: "detalle_ampliado", name: "Detalle ampliado" },
          { code: "filtro_por_metodo", name: "Filtro por método" },
          { code: "borrar_logs", name: "Borrar logs" },
          { code: "detalle_de_log", name: "Detalle de log" },
          { code: "busqueda_y_paginacion", name: "Búsqueda y paginación" },
        ],
      },
      {
        key: "/desarrollador/backups",
        name: "Backups JSON",
        status: "active",
        capabilities: [
          { code: "backup_json_fijo", name: "backup.json fijo" },
          { code: "copias_guardadas", name: "Copias guardadas" },
          { code: "fijar_como_backup_json", name: "Fijar como backup.json" },
          { code: "limpiar_copias", name: "Limpiar copias" },
        ],
      },
      {
        key: "/desarrollador/comandos",
        name: "Comandos",
        status: "active",
        capabilities: [
          { code: "subir_backup_json", name: "Subir backup.json" },
          { code: "descargar_backup", name: "Descargar backup" },
          { code: "recargar_bd", name: "Recargar BD" },
          { code: "progreso_visual", name: "Progreso visual" },
        ],
      },
    ],
  }
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
