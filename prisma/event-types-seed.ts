export type EventTypeSeedEntry = {
  key: string;
  name: string;
  description: string;
};

type EventTypePairSeed = {
  ok: EventTypeSeedEntry;
  failedKey: string;
};

function failedEntry(ok: EventTypeSeedEntry, failedKey: string): EventTypeSeedEntry {
  return {
    key: failedKey,
    name: `${ok.name} (fallido)`,
    description: `La operación falló: ${ok.description.charAt(0).toLowerCase()}${ok.description.slice(1)}`,
  };
}

/** Catálogo de EventType enviado desde apps cliente vía webhook (ok + failed). */
const EVENT_TYPE_PAIRS: EventTypePairSeed[] = [
  {
    ok: { key: "auth.login", name: "Inicio de sesión", description: "Un usuario inició sesión en la app." },
    failedKey: "auth.login_failed",
  },
  {
    ok: { key: "auth.role_changed", name: "Rol de sesión cambiado", description: "El rol activo del usuario en sesión cambió." },
    failedKey: "auth.role_changed_failed",
  },

  {
    ok: { key: "license.created", name: "Licencia creada", description: "Se registró una nueva licencia." },
    failedKey: "license.create_failed",
  },
  {
    ok: { key: "license.updated", name: "Licencia actualizada", description: "Se modificaron datos de una licencia." },
    failedKey: "license.update_failed",
  },
  {
    ok: { key: "license.deleted", name: "Licencia eliminada", description: "Se eliminó una licencia." },
    failedKey: "license.delete_failed",
  },
  {
    ok: { key: "license.renewed", name: "Licencia renovada", description: "Se renovó o extendió una licencia." },
    failedKey: "license.renew_failed",
  },

  {
    ok: { key: "user.created", name: "Usuario creado", description: "Se creó un nuevo usuario en el sistema." },
    failedKey: "user.create_failed",
  },
  {
    ok: { key: "user.updated", name: "Usuario actualizado", description: "Se actualizaron datos de un usuario." },
    failedKey: "user.update_failed",
  },
  {
    ok: { key: "user.deleted", name: "Usuario eliminado", description: "Se eliminó un usuario." },
    failedKey: "user.delete_failed",
  },
  {
    ok: { key: "user.bulk_created", name: "Usuarios creados en lote", description: "Se importaron o crearon usuarios masivamente." },
    failedKey: "user.bulk_create_failed",
  },
  {
    ok: { key: "user.photo_uploaded", name: "Foto de usuario subida", description: "Se cargó o cambió la foto de perfil de un usuario." },
    failedKey: "user.photo_upload_failed",
  },
  {
    ok: { key: "user.photo_deleted", name: "Foto de usuario eliminada", description: "Se eliminó la foto de perfil de un usuario." },
    failedKey: "user.photo_delete_failed",
  },
  {
    ok: { key: "user.data_updated", name: "Datos de usuario actualizados", description: "Se actualizó información extendida del usuario." },
    failedKey: "user.data_update_failed",
  },

  {
    ok: { key: "account.created", name: "Cuenta creada", description: "Se creó una cuenta de acceso." },
    failedKey: "account.create_failed",
  },
  {
    ok: { key: "account.updated", name: "Cuenta actualizada", description: "Se modificó una cuenta de acceso." },
    failedKey: "account.update_failed",
  },
  {
    ok: { key: "account.deleted", name: "Cuenta eliminada", description: "Se eliminó una cuenta de acceso." },
    failedKey: "account.delete_failed",
  },
  {
    ok: { key: "account.password_reset", name: "Contraseña restablecida", description: "Se restableció la contraseña de una cuenta." },
    failedKey: "account.password_reset_failed",
  },
  {
    ok: { key: "account.user_updated", name: "Usuario de cuenta actualizado", description: "Se vinculó o actualizó el usuario asociado a una cuenta." },
    failedKey: "account.user_update_failed",
  },

  {
    ok: { key: "role.created", name: "Rol creado", description: "Se creó un nuevo rol." },
    failedKey: "role.create_failed",
  },
  {
    ok: { key: "role.updated", name: "Rol actualizado", description: "Se modificó un rol existente." },
    failedKey: "role.update_failed",
  },
  {
    ok: { key: "role.deleted", name: "Rol eliminado", description: "Se eliminó un rol." },
    failedKey: "role.delete_failed",
  },

  {
    ok: { key: "order.created", name: "Pedido creado", description: "Se registró un nuevo pedido." },
    failedKey: "order.create_failed",
  },
  {
    ok: { key: "order.updated", name: "Pedido actualizado", description: "Se modificaron datos de un pedido." },
    failedKey: "order.update_failed",
  },
  {
    ok: { key: "order.deleted", name: "Pedido eliminado", description: "Se eliminó un pedido." },
    failedKey: "order.delete_failed",
  },
  {
    ok: { key: "order.status_changed", name: "Estado de pedido cambiado", description: "Cambió el estado de un pedido." },
    failedKey: "order.status_change_failed",
  },
  {
    ok: { key: "order.mark_paid", name: "Pedido marcado como pagado", description: "Un pedido fue marcado como pagado." },
    failedKey: "order.mark_paid_failed",
  },
  {
    ok: { key: "order.pos_checkout", name: "Checkout POS de pedido", description: "Se completó un checkout desde punto de venta." },
    failedKey: "order.pos_checkout_failed",
  },

  {
    ok: { key: "order_item.created", name: "Ítem de pedido creado", description: "Se agregó un ítem a un pedido." },
    failedKey: "order_item.create_failed",
  },
  {
    ok: { key: "order_item.updated", name: "Ítem de pedido actualizado", description: "Se modificó un ítem de pedido." },
    failedKey: "order_item.update_failed",
  },
  {
    ok: { key: "order_item.deleted", name: "Ítem de pedido eliminado", description: "Se eliminó un ítem de pedido." },
    failedKey: "order_item.delete_failed",
  },
  {
    ok: { key: "order_item.mark_delivered", name: "Ítem marcado entregado", description: "Un ítem de pedido fue marcado como entregado." },
    failedKey: "order_item.mark_delivered_failed",
  },
  {
    ok: { key: "order_item.mark_paid", name: "Ítem marcado pagado", description: "Un ítem de pedido fue marcado como pagado." },
    failedKey: "order_item.mark_paid_failed",
  },
  {
    ok: { key: "order_item.programmer_corrected", name: "Ítem corregido por programador", description: "Un ítem fue corregido manualmente por un programador." },
    failedKey: "order_item.programmer_correct_failed",
  },

  {
    ok: { key: "customer.created", name: "Cliente creado", description: "Se registró un nuevo cliente." },
    failedKey: "customer.create_failed",
  },
  {
    ok: { key: "customer.updated", name: "Cliente actualizado", description: "Se actualizaron datos de un cliente." },
    failedKey: "customer.update_failed",
  },
  {
    ok: { key: "customer.deleted", name: "Cliente eliminado", description: "Se eliminó un cliente." },
    failedKey: "customer.delete_failed",
  },

  {
    ok: { key: "supplier.created", name: "Proveedor creado", description: "Se registró un nuevo proveedor." },
    failedKey: "supplier.create_failed",
  },
  {
    ok: { key: "supplier.updated", name: "Proveedor actualizado", description: "Se actualizaron datos de un proveedor." },
    failedKey: "supplier.update_failed",
  },
  {
    ok: { key: "supplier.deleted", name: "Proveedor eliminado", description: "Se eliminó un proveedor." },
    failedKey: "supplier.delete_failed",
  },

  {
    ok: { key: "supplier_order.created", name: "Orden a proveedor creada", description: "Se creó una orden de compra a proveedor." },
    failedKey: "supplier_order.create_failed",
  },
  {
    ok: { key: "supplier_order.updated", name: "Orden a proveedor actualizada", description: "Se modificó una orden a proveedor." },
    failedKey: "supplier_order.update_failed",
  },
  {
    ok: { key: "supplier_order.deleted", name: "Orden a proveedor eliminada", description: "Se eliminó una orden a proveedor." },
    failedKey: "supplier_order.delete_failed",
  },
  {
    ok: { key: "supplier_order.item_added", name: "Ítem agregado a orden proveedor", description: "Se añadió un ítem a una orden de proveedor." },
    failedKey: "supplier_order.item_add_failed",
  },
  {
    ok: { key: "supplier_order.mark_received", name: "Orden proveedor recibida", description: "Una orden a proveedor fue marcada como recibida." },
    failedKey: "supplier_order.mark_received_failed",
  },
  {
    ok: { key: "supplier_order.mark_paid", name: "Orden proveedor pagada", description: "Una orden a proveedor fue marcada como pagada." },
    failedKey: "supplier_order.mark_paid_failed",
  },

  {
    ok: { key: "supplier_payable.paid", name: "Cuenta por pagar saldada", description: "Se registró el pago de una cuenta por pagar a proveedor." },
    failedKey: "supplier_payable.pay_failed",
  },
  {
    ok: { key: "supplier_payable.payment_updated", name: "Pago a proveedor actualizado", description: "Se modificó un pago de cuenta por pagar." },
    failedKey: "supplier_payable.payment_update_failed",
  },
  {
    ok: { key: "supplier_payable.payment_deleted", name: "Pago a proveedor eliminado", description: "Se eliminó un pago de cuenta por pagar." },
    failedKey: "supplier_payable.payment_delete_failed",
  },

  {
    ok: { key: "workbench.order_paid", name: "Pedido pagado en mesa de trabajo", description: "Un pedido fue pagado desde la mesa de trabajo." },
    failedKey: "workbench.order_pay_failed",
  },

  {
    ok: { key: "item_group.created", name: "Grupo de ítems creado", description: "Se creó un grupo de ítems." },
    failedKey: "item_group.create_failed",
  },
  {
    ok: { key: "item_group.updated", name: "Grupo de ítems actualizado", description: "Se modificó un grupo de ítems." },
    failedKey: "item_group.update_failed",
  },
  {
    ok: { key: "item_group.deleted", name: "Grupo de ítems eliminado", description: "Se eliminó un grupo de ítems." },
    failedKey: "item_group.delete_failed",
  },
  {
    ok: { key: "item_group.items_added", name: "Ítems agregados al grupo", description: "Se añadieron ítems a un grupo." },
    failedKey: "item_group.items_add_failed",
  },
  {
    ok: { key: "item_group.item_moved", name: "Ítem movido entre grupos", description: "Un ítem fue movido de un grupo a otro." },
    failedKey: "item_group.item_move_failed",
  },
  {
    ok: { key: "item_group.paid", name: "Grupo de ítems pagado", description: "Un grupo de ítems fue marcado como pagado." },
    failedKey: "item_group.pay_failed",
  },

  {
    ok: { key: "workbench_payment.updated", name: "Pago de mesa actualizado", description: "Se modificó un pago en mesa de trabajo." },
    failedKey: "workbench_payment.update_failed",
  },
  {
    ok: { key: "workbench_payment.deleted", name: "Pago de mesa eliminado", description: "Se eliminó un pago en mesa de trabajo." },
    failedKey: "workbench_payment.delete_failed",
  },

  {
    ok: { key: "product.created", name: "Producto creado", description: "Se registró un nuevo producto." },
    failedKey: "product.create_failed",
  },
  {
    ok: { key: "product.updated", name: "Producto actualizado", description: "Se modificaron datos de un producto." },
    failedKey: "product.update_failed",
  },
  {
    ok: { key: "product.deleted", name: "Producto eliminado", description: "Se eliminó un producto." },
    failedKey: "product.delete_failed",
  },
  {
    ok: { key: "product.stock_adjusted", name: "Stock de producto ajustado", description: "Se ajustó el inventario de un producto." },
    failedKey: "product.stock_adjust_failed",
  },

  {
    ok: { key: "category.created", name: "Categoría creada", description: "Se creó una categoría." },
    failedKey: "category.create_failed",
  },
  {
    ok: { key: "category.updated", name: "Categoría actualizada", description: "Se modificó una categoría." },
    failedKey: "category.update_failed",
  },
  {
    ok: { key: "category.deleted", name: "Categoría eliminada", description: "Se eliminó una categoría." },
    failedKey: "category.delete_failed",
  },

  {
    ok: { key: "unit.created", name: "Unidad creada", description: "Se registró una unidad de medida." },
    failedKey: "unit.create_failed",
  },
  {
    ok: { key: "unit.updated", name: "Unidad actualizada", description: "Se modificó una unidad de medida." },
    failedKey: "unit.update_failed",
  },
  {
    ok: { key: "unit.deleted", name: "Unidad eliminada", description: "Se eliminó una unidad de medida." },
    failedKey: "unit.delete_failed",
  },

  {
    ok: { key: "store.created", name: "Tienda creada", description: "Se registró una nueva tienda o sucursal." },
    failedKey: "store.create_failed",
  },
  {
    ok: { key: "store.updated", name: "Tienda actualizada", description: "Se modificaron datos de una tienda." },
    failedKey: "store.update_failed",
  },
  {
    ok: { key: "store.deleted", name: "Tienda eliminada", description: "Se eliminó una tienda." },
    failedKey: "store.delete_failed",
  },
  {
    ok: { key: "store.product_assigned", name: "Producto asignado a tienda", description: "Un producto fue asignado a una tienda." },
    failedKey: "store.product_assign_failed",
  },
  {
    ok: { key: "store.product_removed", name: "Producto removido de tienda", description: "Un producto dejó de estar disponible en una tienda." },
    failedKey: "store.product_remove_failed",
  },
  {
    ok: { key: "store.product_toggled", name: "Producto activado/desactivado en tienda", description: "Cambió la disponibilidad de un producto en tienda." },
    failedKey: "store.product_toggle_failed",
  },

  {
    ok: { key: "movement.created", name: "Movimiento de inventario creado", description: "Se registró un movimiento de stock." },
    failedKey: "movement.create_failed",
  },
  {
    ok: { key: "movement.batch_created", name: "Movimientos creados en lote", description: "Se registraron movimientos de inventario masivamente." },
    failedKey: "movement.batch_create_failed",
  },
  {
    ok: { key: "movement.presentation_opened", name: "Presentación de movimiento abierta", description: "Se abrió una presentación asociada a un movimiento." },
    failedKey: "movement.presentation_open_failed",
  },
  {
    ok: { key: "movement.updated", name: "Movimiento actualizado", description: "Se modificó un movimiento de inventario." },
    failedKey: "movement.update_failed",
  },
  {
    ok: { key: "movement.date_batch_updated", name: "Fechas de movimientos actualizadas", description: "Se actualizaron fechas de un lote de movimientos." },
    failedKey: "movement.date_batch_update_failed",
  },
  {
    ok: { key: "movement.deleted", name: "Movimiento eliminado", description: "Se eliminó un movimiento de inventario." },
    failedKey: "movement.delete_failed",
  },

  {
    ok: { key: "production.intermediate_registered", name: "Producción intermedia registrada", description: "Se registró una etapa intermedia de producción." },
    failedKey: "production.intermediate_register_failed",
  },
  {
    ok: { key: "production.final_registered", name: "Producción final registrada", description: "Se registró la producción final de un producto." },
    failedKey: "production.final_register_failed",
  },

  {
    ok: { key: "recipe.created", name: "Receta creada", description: "Se creó una receta." },
    failedKey: "recipe.create_failed",
  },
  {
    ok: { key: "recipe.updated", name: "Receta actualizada", description: "Se modificó una receta." },
    failedKey: "recipe.update_failed",
  },
  {
    ok: { key: "recipe.deleted", name: "Receta eliminada", description: "Se eliminó una receta." },
    failedKey: "recipe.delete_failed",
  },

  {
    ok: { key: "catalog_entry.created", name: "Entrada de catálogo creada", description: "Se añadió una entrada al catálogo." },
    failedKey: "catalog_entry.create_failed",
  },
  {
    ok: { key: "catalog_entry.updated", name: "Entrada de catálogo actualizada", description: "Se modificó una entrada del catálogo." },
    failedKey: "catalog_entry.update_failed",
  },
  {
    ok: { key: "catalog_entry.deleted", name: "Entrada de catálogo eliminada", description: "Se eliminó una entrada del catálogo." },
    failedKey: "catalog_entry.delete_failed",
  },
  {
    ok: { key: "catalog.reordered", name: "Catálogo reordenado", description: "Se cambió el orden de elementos del catálogo." },
    failedKey: "catalog.reorder_failed",
  },

  {
    ok: { key: "compare_group.created", name: "Grupo comparativo creado", description: "Se creó un grupo de comparación." },
    failedKey: "compare_group.create_failed",
  },
  {
    ok: { key: "compare_group.updated", name: "Grupo comparativo actualizado", description: "Se modificó un grupo de comparación." },
    failedKey: "compare_group.update_failed",
  },
  {
    ok: { key: "compare_group.deleted", name: "Grupo comparativo eliminado", description: "Se eliminó un grupo de comparación." },
    failedKey: "compare_group.delete_failed",
  },
  {
    ok: { key: "compare_group.pasteles_bootstrapped", name: "Grupo pasteles inicializado", description: "Se bootstrapó el grupo comparativo de pasteles." },
    failedKey: "compare_group.pasteles_bootstrap_failed",
  },

  {
    ok: { key: "tier_group.created", name: "Grupo de niveles creado", description: "Se creó un grupo de niveles (tiers)." },
    failedKey: "tier_group.create_failed",
  },
  {
    ok: { key: "tier_group.updated", name: "Grupo de niveles actualizado", description: "Se modificó un grupo de niveles." },
    failedKey: "tier_group.update_failed",
  },
  {
    ok: { key: "tier_group.deleted", name: "Grupo de niveles eliminado", description: "Se eliminó un grupo de niveles." },
    failedKey: "tier_group.delete_failed",
  },
  {
    ok: { key: "tier_group.migrated_from_categories", name: "Niveles migrados desde categorías", description: "Se migró un grupo de niveles desde categorías." },
    failedKey: "tier_group.migrate_from_categories_failed",
  },

  {
    ok: { key: "home_product.created", name: "Producto home creado", description: "Se creó un producto destacado en inicio." },
    failedKey: "home_product.create_failed",
  },
  {
    ok: { key: "home_product.updated", name: "Producto home actualizado", description: "Se modificó un producto destacado en inicio." },
    failedKey: "home_product.update_failed",
  },
  {
    ok: { key: "home_product.deleted", name: "Producto home eliminado", description: "Se eliminó un producto destacado en inicio." },
    failedKey: "home_product.delete_failed",
  },

  {
    ok: { key: "generic_ingredient.created", name: "Ingrediente genérico creado", description: "Se registró un ingrediente genérico." },
    failedKey: "generic_ingredient.create_failed",
  },
  {
    ok: { key: "generic_ingredient.bootstrapped", name: "Ingredientes genéricos inicializados", description: "Se bootstrapó el catálogo de ingredientes genéricos." },
    failedKey: "generic_ingredient.bootstrap_failed",
  },

  {
    ok: { key: "presentation.created", name: "Presentación creada", description: "Se creó una presentación de producto." },
    failedKey: "presentation.create_failed",
  },
  {
    ok: { key: "presentation.linked", name: "Presentación vinculada", description: "Se vinculó una presentación a otro recurso." },
    failedKey: "presentation.link_failed",
  },
  {
    ok: { key: "presentation.unlinked", name: "Presentación desvinculada", description: "Se desvinculó una presentación." },
    failedKey: "presentation.unlink_failed",
  },

  {
    ok: { key: "income.created", name: "Ingreso creado", description: "Se registró un ingreso." },
    failedKey: "income.create_failed",
  },
  {
    ok: { key: "income.updated", name: "Ingreso actualizado", description: "Se modificó un ingreso." },
    failedKey: "income.update_failed",
  },
  {
    ok: { key: "income.deleted", name: "Ingreso eliminado", description: "Se eliminó un ingreso." },
    failedKey: "income.delete_failed",
  },

  {
    ok: { key: "expense.created", name: "Gasto creado", description: "Se registró un gasto." },
    failedKey: "expense.create_failed",
  },
  {
    ok: { key: "expense.updated", name: "Gasto actualizado", description: "Se modificó un gasto." },
    failedKey: "expense.update_failed",
  },
  {
    ok: { key: "expense.deleted", name: "Gasto eliminado", description: "Se eliminó un gasto." },
    failedKey: "expense.delete_failed",
  },

  {
    ok: { key: "obligation.created", name: "Obligación creada", description: "Se registró una obligación financiera." },
    failedKey: "obligation.create_failed",
  },
  {
    ok: { key: "obligation.paid", name: "Obligación pagada", description: "Se marcó una obligación como pagada." },
    failedKey: "obligation.pay_failed",
  },
  {
    ok: { key: "obligation.cancelled", name: "Obligación cancelada", description: "Se canceló una obligación." },
    failedKey: "obligation.cancel_failed",
  },

  {
    ok: { key: "recurring_template.created", name: "Plantilla recurrente creada", description: "Se creó una plantilla de movimiento recurrente." },
    failedKey: "recurring_template.create_failed",
  },
  {
    ok: { key: "recurring_template.updated", name: "Plantilla recurrente actualizada", description: "Se modificó una plantilla recurrente." },
    failedKey: "recurring_template.update_failed",
  },
  {
    ok: { key: "recurring.occurrences_generated", name: "Ocurrencias recurrentes generadas", description: "Se generaron ocurrencias desde una recurrencia." },
    failedKey: "recurring.occurrences_generate_failed",
  },

  {
    ok: { key: "recurring_occurrence.updated", name: "Ocurrencia recurrente actualizada", description: "Se modificó una ocurrencia recurrente." },
    failedKey: "recurring_occurrence.update_failed",
  },
  {
    ok: { key: "recurring_occurrence.paid", name: "Ocurrencia recurrente pagada", description: "Se pagó una ocurrencia recurrente." },
    failedKey: "recurring_occurrence.pay_failed",
  },
  {
    ok: { key: "recurring_occurrence.skipped", name: "Ocurrencia recurrente omitida", description: "Se omitió una ocurrencia recurrente." },
    failedKey: "recurring_occurrence.skip_failed",
  },

  {
    ok: { key: "shift.opened", name: "Turno abierto", description: "Se abrió un turno de caja o operación." },
    failedKey: "shift.open_failed",
  },
  {
    ok: { key: "shift.closed", name: "Turno cerrado", description: "Se cerró un turno." },
    failedKey: "shift.close_failed",
  },
  {
    ok: { key: "shift.updated", name: "Turno actualizado", description: "Se modificaron datos de un turno." },
    failedKey: "shift.update_failed",
  },

  {
    ok: { key: "shift_movement.created", name: "Movimiento de turno creado", description: "Se registró un movimiento dentro de un turno." },
    failedKey: "shift_movement.create_failed",
  },
  {
    ok: { key: "shift_movement.updated", name: "Movimiento de turno actualizado", description: "Se modificó un movimiento de turno." },
    failedKey: "shift_movement.update_failed",
  },
  {
    ok: { key: "shift_movement.deleted", name: "Movimiento de turno eliminado", description: "Se eliminó un movimiento de turno." },
    failedKey: "shift_movement.delete_failed",
  },

  {
    ok: { key: "task_plan.created", name: "Plan de tareas creado", description: "Se creó un plan de tareas." },
    failedKey: "task_plan.create_failed",
  },
  {
    ok: { key: "task_plan.updated", name: "Plan de tareas actualizado", description: "Se modificó un plan de tareas." },
    failedKey: "task_plan.update_failed",
  },
  {
    ok: { key: "task_plan.deleted", name: "Plan de tareas eliminado", description: "Se eliminó un plan de tareas." },
    failedKey: "task_plan.delete_failed",
  },
  {
    ok: { key: "task_plan.published", name: "Plan de tareas publicado", description: "Se publicó un plan de tareas." },
    failedKey: "task_plan.publish_failed",
  },

  {
    ok: { key: "task_item.status_updated", name: "Estado de tarea actualizado", description: "Cambió el estado de un ítem de tarea." },
    failedKey: "task_item.status_update_failed",
  },
  {
    ok: { key: "task_item.deleted", name: "Ítem de tarea eliminado", description: "Se eliminó un ítem de tarea." },
    failedKey: "task_item.delete_failed",
  },
  {
    ok: { key: "task_item.open_box_executed", name: "Apertura de caja ejecutada", description: "Se ejecutó la acción de abrir caja en una tarea." },
    failedKey: "task_item.open_box_execute_failed",
  },

  {
    ok: { key: "notification.created", name: "Notificación creada", description: "Se generó una nueva notificación." },
    failedKey: "notification.create_failed",
  },
  {
    ok: { key: "notification.mark_seen", name: "Notificación vista", description: "Una notificación fue marcada como vista." },
    failedKey: "notification.mark_seen_failed",
  },
  {
    ok: { key: "notification.mark_all_seen", name: "Todas las notificaciones vistas", description: "Todas las notificaciones fueron marcadas como vistas." },
    failedKey: "notification.mark_all_seen_failed",
  },
  {
    ok: { key: "notification.mark_bulk_seen", name: "Notificaciones vistas en lote", description: "Varias notificaciones fueron marcadas como vistas." },
    failedKey: "notification.mark_bulk_seen_failed",
  },
  {
    ok: { key: "notification.deleted", name: "Notificación eliminada", description: "Se eliminó una notificación." },
    failedKey: "notification.delete_failed",
  },
  {
    ok: { key: "notification.bulk_deleted", name: "Notificaciones eliminadas en lote", description: "Se eliminaron notificaciones masivamente." },
    failedKey: "notification.bulk_delete_failed",
  },
  {
    ok: { key: "notification.read_deleted", name: "Notificaciones leídas eliminadas", description: "Se eliminaron notificaciones ya leídas." },
    failedKey: "notification.read_delete_failed",
  },

  {
    ok: { key: "notification_program.created", name: "Programa de notificaciones creado", description: "Se creó un programa de notificaciones." },
    failedKey: "notification_program.create_failed",
  },
  {
    ok: { key: "notification_program.updated", name: "Programa de notificaciones actualizado", description: "Se modificó un programa de notificaciones." },
    failedKey: "notification_program.update_failed",
  },
  {
    ok: { key: "notification_program.deleted", name: "Programa de notificaciones eliminado", description: "Se eliminó un programa de notificaciones." },
    failedKey: "notification_program.delete_failed",
  },
  {
    ok: { key: "notification_program.sent", name: "Programa de notificaciones enviado", description: "Se ejecutó el envío de un programa de notificaciones." },
    failedKey: "notification_program.send_failed",
  },

  {
    ok: { key: "publicidad_device.registered", name: "Dispositivo publicidad registrado", description: "Se registró un dispositivo de publicidad." },
    failedKey: "publicidad_device.register_failed",
  },
  {
    ok: { key: "publicidad_device.updated", name: "Dispositivo publicidad actualizado", description: "Se actualizó un dispositivo de publicidad." },
    failedKey: "publicidad_device.update_failed",
  },
  {
    ok: { key: "publicidad_device.deleted", name: "Dispositivo publicidad eliminado", description: "Se eliminó un dispositivo de publicidad." },
    failedKey: "publicidad_device.delete_failed",
  },

  {
    ok: { key: "publicidad_campaign.created", name: "Campaña publicitaria creada", description: "Se creó una campaña de publicidad." },
    failedKey: "publicidad_campaign.create_failed",
  },
  {
    ok: { key: "publicidad_campaign.updated", name: "Campaña publicitaria actualizada", description: "Se modificó una campaña de publicidad." },
    failedKey: "publicidad_campaign.update_failed",
  },
  {
    ok: { key: "publicidad_campaign.deleted", name: "Campaña publicitaria eliminada", description: "Se eliminó una campaña de publicidad." },
    failedKey: "publicidad_campaign.delete_failed",
  },

  {
    ok: { key: "media.uploaded", name: "Medio subido", description: "Se subió un archivo multimedia." },
    failedKey: "media.upload_failed",
  },
  {
    ok: { key: "media.deleted", name: "Medio eliminado", description: "Se eliminó un archivo multimedia." },
    failedKey: "media.delete_failed",
  },

  {
    ok: { key: "image.uploaded", name: "Imagen subida", description: "Se subió una imagen." },
    failedKey: "image.upload_failed",
  },
  {
    ok: { key: "image.deleted", name: "Imagen eliminada", description: "Se eliminó una imagen." },
    failedKey: "image.delete_failed",
  },

  {
    ok: { key: "file.uploaded", name: "Archivo subido", description: "Se subió un archivo." },
    failedKey: "file.upload_failed",
  },
  {
    ok: { key: "file.deleted", name: "Archivo eliminado", description: "Se eliminó un archivo." },
    failedKey: "file.delete_failed",
  },

  {
    ok: { key: "document.uploaded", name: "Documento subido", description: "Se subió un documento." },
    failedKey: "document.upload_failed",
  },
  {
    ok: { key: "document.deleted", name: "Documento eliminado", description: "Se eliminó un documento." },
    failedKey: "document.delete_failed",
  },

  {
    ok: { key: "editor.template_imported", name: "Plantilla de editor importada", description: "Se importó una plantilla al editor." },
    failedKey: "editor.template_import_failed",
  },
  {
    ok: { key: "editor.template_updated", name: "Plantilla de editor actualizada", description: "Se modificó una plantilla del editor." },
    failedKey: "editor.template_update_failed",
  },
  {
    ok: { key: "editor.template_doc_updated", name: "Documento de plantilla actualizado", description: "Se actualizó el documento de una plantilla." },
    failedKey: "editor.template_doc_update_failed",
  },
  {
    ok: { key: "editor.template_deleted", name: "Plantilla de editor eliminada", description: "Se eliminó una plantilla del editor." },
    failedKey: "editor.template_delete_failed",
  },
  {
    ok: { key: "editor.design_created", name: "Diseño de editor creado", description: "Se creó un diseño en el editor." },
    failedKey: "editor.design_create_failed",
  },
  {
    ok: { key: "editor.design_updated", name: "Diseño de editor actualizado", description: "Se modificó un diseño del editor." },
    failedKey: "editor.design_update_failed",
  },
  {
    ok: { key: "editor.override_upserted", name: "Override de editor guardado", description: "Se creó o actualizó un override de diseño." },
    failedKey: "editor.override_upsert_failed",
  },

  {
    ok: { key: "sri.settings_updated", name: "Configuración SRI actualizada", description: "Se actualizó la configuración del SRI." },
    failedKey: "sri.settings_update_failed",
  },
  {
    ok: { key: "sri.certificate_uploaded", name: "Certificado SRI subido", description: "Se cargó un certificado digital del SRI." },
    failedKey: "sri.certificate_upload_failed",
  },
  {
    ok: { key: "sri.certificate_deleted", name: "Certificado SRI eliminado", description: "Se eliminó un certificado digital del SRI." },
    failedKey: "sri.certificate_delete_failed",
  },
  {
    ok: { key: "sri.invoice.emitted", name: "Factura SRI emitida", description: "Se emitió una factura electrónica al SRI." },
    failedKey: "sri.invoice.emit_failed",
  },
  {
    ok: { key: "sri.invoice.refreshed", name: "Factura SRI actualizada", description: "Se refrescó el estado de una factura electrónica." },
    failedKey: "sri.invoice.refresh_failed",
  },

  {
    ok: { key: "app.settings_updated", name: "Configuración de app actualizada", description: "Se modificó la configuración general de la aplicación." },
    failedKey: "app.settings_update_failed",
  },

  {
    ok: { key: "subscription.entitlement_updated", name: "Entitlement actualizado", description: "Se actualizó el entitlement de suscripción." },
    failedKey: "subscription.entitlement_update_failed",
  },
  {
    ok: { key: "subscription.pulled", name: "Suscripción sincronizada", description: "La app sincronizó la suscripción desde el gestor." },
    failedKey: "subscription.pull_failed",
  },

  {
    ok: { key: "backup.saved", name: "Respaldo guardado", description: "Se guardó un respaldo de datos." },
    failedKey: "backup.save_failed",
  },
  {
    ok: { key: "backup.uploaded", name: "Respaldo subido", description: "Se subió un archivo de respaldo." },
    failedKey: "backup.upload_failed",
  },
  {
    ok: { key: "backup.set_main", name: "Respaldo principal definido", description: "Se marcó un respaldo como principal." },
    failedKey: "backup.set_main_failed",
  },
  {
    ok: { key: "backup.stored_deleted", name: "Respaldo almacenado eliminado", description: "Se eliminó un respaldo almacenado." },
    failedKey: "backup.stored_delete_failed",
  },
  {
    ok: { key: "backup.pruned", name: "Respaldos depurados", description: "Se depuraron respaldos antiguos." },
    failedKey: "backup.prune_failed",
  },

  {
    ok: { key: "database.reloaded", name: "Base de datos recargada", description: "Se recargó o restauró la base de datos de la app." },
    failedKey: "database.reload_failed",
  },

  {
    ok: { key: "log.deleted", name: "Logs eliminados", description: "Se eliminaron registros de log en lote." },
    failedKey: "log.delete_failed",
  },
  {
    ok: { key: "log.entry_deleted", name: "Entrada de log eliminada", description: "Se eliminó una entrada individual de log." },
    failedKey: "log.entry_delete_failed",
  },
];

export const EVENT_TYPES_SEED: EventTypeSeedEntry[] = EVENT_TYPE_PAIRS.flatMap((pair) => [
  pair.ok,
  failedEntry(pair.ok, pair.failedKey),
]);

export const EVENT_TYPE_OK_KEYS = EVENT_TYPE_PAIRS.map((pair) => pair.ok.key);

export const EVENT_TYPE_FAILED_BY_OK = Object.fromEntries(
  EVENT_TYPE_PAIRS.map((pair) => [pair.ok.key, pair.failedKey]),
) as Record<string, string>;
