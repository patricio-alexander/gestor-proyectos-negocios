-- Índices para panel de acceso (overrides por app, secciones ordenadas, capacidades)

-- Listado de secciones por módulo con orden estable
CREATE INDEX `Section_module_id_deleted_at_created_at_idx`
  ON `Section`(`module_id`, `deleted_at`, `created_at`);

-- Overrides por sección (GET /sections/:id/app-status)
CREATE INDEX `AppSection_section_id_status_idx`
  ON `AppSection`(`section_id`, `status`);

-- Capabilities ordenadas por sección
CREATE INDEX `Capability_section_id_created_at_idx`
  ON `Capability`(`section_id`, `created_at`);
