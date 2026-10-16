-- Renombra sección Insumos y marcas → Enlaces productos.
-- Agrega sección Desarrollador → Pruebas (/desarrollador/pruebas).

UPDATE `Section`
SET `name` = 'Enlaces productos', `updated_at` = NOW()
WHERE `key` = '/produccion/insumos' AND `deleted_at` IS NULL;

-- Insertar Pruebas si falta (module key = desarrollador).
INSERT INTO `Section` (`module_id`, `key`, `name`, `status`, `created_at`, `updated_at`)
SELECT m.`id`, '/desarrollador/pruebas', 'Pruebas', 'active', NOW(), NOW()
FROM `Module` m
WHERE m.`key` = 'desarrollador'
  AND m.`deleted_at` IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM `Section` s
    WHERE s.`module_id` = m.`id`
      AND s.`key` = '/desarrollador/pruebas'
      AND s.`deleted_at` IS NULL
  );

-- Capability base de la sección Pruebas.
INSERT INTO `Capability` (`section_id`, `code`, `name`, `is_active`, `created_at`, `updated_at`)
SELECT s.`id`, 'bolita_explosiva', 'Bolita explosiva', 1, NOW(), NOW()
FROM `Section` s
INNER JOIN `Module` m ON m.`id` = s.`module_id`
WHERE m.`key` = 'desarrollador'
  AND s.`key` = '/desarrollador/pruebas'
  AND s.`deleted_at` IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM `Capability` c
    WHERE c.`section_id` = s.`id` AND c.`code` = 'bolita_explosiva'
  );
