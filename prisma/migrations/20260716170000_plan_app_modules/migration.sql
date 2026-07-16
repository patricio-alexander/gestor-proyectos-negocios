-- AppModule: surrogate id (PlanAppModule referencia app_module_id)
ALTER TABLE `AppModule`
  DROP PRIMARY KEY,
  ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT FIRST,
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE INDEX `AppModule_app_id_module_id_key`(`app_id`, `module_id`);

-- PlanAppModule: módulos de una app seleccionados por plan
CREATE TABLE `PlanAppModule` (
    `plan_id` INTEGER NOT NULL,
    `app_module_id` INTEGER NOT NULL,

    INDEX `PlanAppModule_plan_id_idx`(`plan_id`),
    INDEX `PlanAppModule_app_module_id_idx`(`app_module_id`),
    PRIMARY KEY (`plan_id`, `app_module_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AppModule en app plantilla para cada módulo de plan (si falta)
INSERT IGNORE INTO `AppModule` (`app_id`, `module_id`)
SELECT t.`id`, pm.`module_id`
FROM `PlanModule` pm
CROSS JOIN `Apps` t ON t.`kind` = 'template' AND t.`deleted_at` IS NULL;

-- Migrar PlanModule → PlanAppModule (vía AppPlan si existe)
INSERT IGNORE INTO `PlanAppModule` (`plan_id`, `app_module_id`)
SELECT pm.`plan_id`, am.`id`
FROM `PlanModule` pm
INNER JOIN `AppPlan` ap ON ap.`plan_id` = pm.`plan_id`
INNER JOIN `AppModule` am ON am.`app_id` = ap.`app_id` AND am.`module_id` = pm.`module_id`;

-- Planes sin AppPlan: usar app plantilla
INSERT IGNORE INTO `PlanAppModule` (`plan_id`, `app_module_id`)
SELECT pm.`plan_id`, am.`id`
FROM `PlanModule` pm
INNER JOIN `Apps` t ON t.`kind` = 'template' AND t.`deleted_at` IS NULL
INNER JOIN `AppModule` am ON am.`app_id` = t.`id` AND am.`module_id` = pm.`module_id`
WHERE NOT EXISTS (
  SELECT 1 FROM `PlanAppModule` pam WHERE pam.`plan_id` = pm.`plan_id`
);

ALTER TABLE `PlanAppModule`
  ADD CONSTRAINT `PlanAppModule_plan_id_fkey`
    FOREIGN KEY (`plan_id`) REFERENCES `Plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PlanAppModule`
  ADD CONSTRAINT `PlanAppModule_app_module_id_fkey`
    FOREIGN KEY (`app_module_id`) REFERENCES `AppModule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE `PlanModule`;
DROP TABLE `AppPlan`;
