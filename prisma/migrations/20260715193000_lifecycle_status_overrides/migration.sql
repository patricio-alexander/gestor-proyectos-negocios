-- Override de lifecycle por app (gana sobre status global de módulo/sección)

CREATE TABLE `ModuleStatusOverride` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `module_id` INTEGER NOT NULL,
    `app_id` INTEGER NOT NULL,
    `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SectionStatusOverride` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `section_id` INTEGER NOT NULL,
    `app_id` INTEGER NOT NULL,
    `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `ModuleStatusOverride_module_id_app_id_key` ON `ModuleStatusOverride`(`module_id`, `app_id`);
CREATE INDEX `ModuleStatusOverride_app_id_idx` ON `ModuleStatusOverride`(`app_id`);

CREATE UNIQUE INDEX `SectionStatusOverride_section_id_app_id_key` ON `SectionStatusOverride`(`section_id`, `app_id`);
CREATE INDEX `SectionStatusOverride_app_id_idx` ON `SectionStatusOverride`(`app_id`);

ALTER TABLE `ModuleStatusOverride` ADD CONSTRAINT `ModuleStatusOverride_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `Module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ModuleStatusOverride` ADD CONSTRAINT `ModuleStatusOverride_app_id_fkey` FOREIGN KEY (`app_id`) REFERENCES `Apps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SectionStatusOverride` ADD CONSTRAINT `SectionStatusOverride_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `Section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `SectionStatusOverride` ADD CONSTRAINT `SectionStatusOverride_app_id_fkey` FOREIGN KEY (`app_id`) REFERENCES `Apps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
