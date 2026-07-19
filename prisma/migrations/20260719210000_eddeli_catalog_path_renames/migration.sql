-- Renombra rutas del catálogo EdDeli (section.key) y módulos (Module.key).
-- Los paths nuevos se alinean con eddeli-product-catalog.ts.
-- Ejecutar seed después si faltan módulos/secciones nuevas (publico, info, notas-debito, etc.).

-- Módulos
UPDATE `Module`
SET `key` = 'canal', `updated_at` = NOW()
WHERE `key` = 'canal_digital' AND `deleted_at` IS NULL;

-- Secciones: paths largos primero (evita colisiones de prefijo)
UPDATE `Section` SET `key` = '/operacion/supervision-caja', `updated_at` = NOW()
WHERE `key` = '/turno/supervision' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/operacion/turno/multi-caja', `updated_at` = NOW()
WHERE `key` = '/turno/multi-caja' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/ventas/clientes/cuentas', `updated_at` = NOW()
WHERE `key` = '/inventory/customers/cuentas' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/produccion/proveedores/cuentas', `updated_at` = NOW()
WHERE `key` = '/inventory/suppliers/cuentas' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/finanzas/prestamos-deudas', `updated_at` = NOW()
WHERE `key` = '/inventory/prestamos-deudas' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/finanzas/gastos-recurrentes', `updated_at` = NOW()
WHERE `key` = '/inventory/gastos-recurrentes' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/canal/productos-destacados', `updated_at` = NOW()
WHERE `key` = '/inventory/productos-destacados' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/canal/locales', `updated_at` = NOW()
WHERE `key` = '/inventory/puntos-venta' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/ventas/pedidos', `updated_at` = NOW()
WHERE `key` = '/inventory/orders' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/ventas/clientes', `updated_at` = NOW()
WHERE `key` = '/inventory/customers' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/finanzas/movimientos', `updated_at` = NOW()
WHERE `key` = '/inventory/finance' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/finanzas/cobranzas', `updated_at` = NOW()
WHERE `key` = '/inventory/collections' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/inventario/productos', `updated_at` = NOW()
WHERE `key` = '/inventory/products' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/inventario/movimientos', `updated_at` = NOW()
WHERE `key` = '/inventory/movement' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/inventario/categorias', `updated_at` = NOW()
WHERE `key` = '/inventory/categories' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/inventario/tramos', `updated_at` = NOW()
WHERE `key` = '/inventory/tramos' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/inventario/unidades', `updated_at` = NOW()
WHERE `key` = '/inventory/units' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/inventario/bodegas', `updated_at` = NOW()
WHERE `key` = '/inventory/bodegas' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/inventario/lotes', `updated_at` = NOW()
WHERE `key` = '/inventory/lotes' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/produccion/insumos', `updated_at` = NOW()
WHERE `key` = '/inventory/insumos' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/produccion/recetas', `updated_at` = NOW()
WHERE `key` = '/inventory/recipes' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/produccion/fabricacion', `updated_at` = NOW()
WHERE `key` = '/inventory/production' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/produccion/proveedores', `updated_at` = NOW()
WHERE `key` = '/inventory/suppliers' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/canal/catalogo', `updated_at` = NOW()
WHERE `key` = '/catalog_manager' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/canal/grupos-comparativos', `updated_at` = NOW()
WHERE `key` = '/compare_groups' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/administracion/programas-notificacion', `updated_at` = NOW()
WHERE `key` = '/notification-programs' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/administracion/panel-control', `updated_at` = NOW()
WHERE `key` = '/panel_control' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/sistema/notificaciones', `updated_at` = NOW()
WHERE `key` = '/notifications' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/administracion/usuarios', `updated_at` = NOW()
WHERE `key` = '/users' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/administracion/cuentas', `updated_at` = NOW()
WHERE `key` = '/cuentas' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/administracion/roles', `updated_at` = NOW()
WHERE `key` = '/roles' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/operacion/turno', `updated_at` = NOW()
WHERE `key` = '/turno' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/operacion/caja', `updated_at` = NOW()
WHERE `key` = '/caja' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/operacion/tareas', `updated_at` = NOW()
WHERE `key` = '/tareas' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/operacion/comprobantes-pos', `updated_at` = NOW()
WHERE `key` = '/facturacion' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/sistema/perfil', `updated_at` = NOW()
WHERE `key` = '/perfil' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/sistema/donaciones', `updated_at` = NOW()
WHERE `key` = '/donaciones' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/desarrollador/imagenes', `updated_at` = NOW()
WHERE `key` = '/img' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/desarrollador/archivos', `updated_at` = NOW()
WHERE `key` = '/file' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/desarrollador/logs', `updated_at` = NOW()
WHERE `key` = '/logs' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/desarrollador/backups', `updated_at` = NOW()
WHERE `key` = '/backups' AND `deleted_at` IS NULL;

UPDATE `Section` SET `key` = '/desarrollador/comandos', `updated_at` = NOW()
WHERE `key` = '/comandos' AND `deleted_at` IS NULL;

-- Obsoletos / aliases / redirects del catálogo anterior
UPDATE `Section` SET `deleted_at` = NOW(), `updated_at` = NOW()
WHERE `key` IN (
  '/inicio',
  '/backery',
  '/comprobantes',
  '/sistema/facturacion-electronica',
  '/facturacion/sri',
  '/catalogo',
  '/punto_venta',
  '/tv',
  '/editor',
  '/publicity_edit',
  '/editorDefault',
  '/templates',
  '/app-settings'
) AND `deleted_at` IS NULL;

-- /info pasó a módulo suelto; la sección en sistema se re-crea vía seed si hace falta
UPDATE `Section` SET `deleted_at` = NOW(), `updated_at` = NOW()
WHERE `key` = '/info'
  AND `module_id` IN (SELECT `id` FROM `Module` WHERE `key` = 'sistema' AND `deleted_at` IS NULL)
  AND `deleted_at` IS NULL;

-- Módulo notificaciones absorbido por sistema (/sistema/notificaciones)
UPDATE `Module` SET `deleted_at` = NOW(), `updated_at` = NOW()
WHERE `key` = 'notificaciones' AND `deleted_at` IS NULL;

UPDATE `Section` SET `deleted_at` = NOW(), `updated_at` = NOW()
WHERE `module_id` IN (SELECT `id` FROM `Module` WHERE `key` = 'notificaciones')
  AND `deleted_at` IS NULL;
