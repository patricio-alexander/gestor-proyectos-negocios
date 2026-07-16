-- DropForeignKey
ALTER TABLE `ModuleStatusOverride` DROP FOREIGN KEY `ModuleStatusOverride_app_id_fkey`;

-- DropForeignKey
ALTER TABLE `ModuleStatusOverride` DROP FOREIGN KEY `ModuleStatusOverride_module_id_fkey`;

-- DropForeignKey
ALTER TABLE `SectionStatusOverride` DROP FOREIGN KEY `SectionStatusOverride_app_id_fkey`;

-- DropForeignKey
ALTER TABLE `SectionStatusOverride` DROP FOREIGN KEY `SectionStatusOverride_section_id_fkey`;

-- DropTable
DROP TABLE `ModuleStatusOverride`;

-- DropTable
DROP TABLE `SectionStatusOverride`;

-- CreateTable
CREATE TABLE `AppModule` (
    `app_id` INTEGER NOT NULL,
    `module_id` INTEGER NOT NULL,
    `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned') NULL,

    INDEX `AppModule_app_id_idx`(`app_id`),
    INDEX `AppModule_module_id_idx`(`module_id`),
    PRIMARY KEY (`app_id`, `module_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppSection` (
    `app_id` INTEGER NOT NULL,
    `section_id` INTEGER NOT NULL,
    `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned') NULL,

    INDEX `AppSection_app_id_idx`(`app_id`),
    INDEX `AppSection_section_id_idx`(`section_id`),
    PRIMARY KEY (`app_id`, `section_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AppModule` ADD CONSTRAINT `AppModule_app_id_fkey` FOREIGN KEY (`app_id`) REFERENCES `Apps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppModule` ADD CONSTRAINT `AppModule_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `Module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppSection` ADD CONSTRAINT `AppSection_app_id_fkey` FOREIGN KEY (`app_id`) REFERENCES `Apps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppSection` ADD CONSTRAINT `AppSection_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `Section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrar datos: asignar módulos a apps deployment según sus planes activos
INSERT IGNORE INTO `AppModule` (`app_id`, `module_id`)
SELECT DISTINCT a.id, pm.module_id
FROM `Subscription` s
INNER JOIN `Apps` a ON a.hash = s.app_hash
INNER JOIN `PlanPrice` pp ON pp.id = s.plan_price_id
INNER JOIN `Plan` p ON p.id = pp.plan_id
INNER JOIN `PlanModule` pm ON pm.plan_id = p.id
WHERE s.status = 'ACTIVE'
  AND a.kind = 'deployment';

-- Apps deployment sin suscripción activa: recibir todos los módulos del catálogo
INSERT IGNORE INTO `AppModule` (`app_id`, `module_id`)
SELECT a.id, m.id
FROM `Apps` a
CROSS JOIN `Module` m
INNER JOIN `Apps` template_app ON template_app.id = m.app_id AND template_app.kind = 'template'
WHERE a.kind = 'deployment'
  AND a.deleted_at IS NULL
  AND m.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM `Subscription` s
    INNER JOIN `PlanPrice` pp ON pp.id = s.plan_price_id
    WHERE s.app_hash = a.hash AND s.status = 'ACTIVE'
  );
