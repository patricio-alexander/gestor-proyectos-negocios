-- Create AppModule table from existing Module data
CREATE TABLE `AppModule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(64) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `app_target` VARCHAR(32) NOT NULL DEFAULT 'eddeli',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `AppModule_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrate data from Module to AppModule
INSERT INTO `AppModule` (`id`, `key`, `name`, `created_at`, `updated_at`, `deleted_at`)
SELECT `id`, `key`, COALESCE(`name`, `key`), `created_at`, `updated_at`, `deleted_at`
FROM `Module`;

-- Create AppSection table
CREATE TABLE `AppSection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `app_module_id` INTEGER NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `route_path` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `AppSection_app_module_id_key_key`(`app_module_id`, `key`),
    INDEX `AppSection_app_module_id_idx`(`app_module_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrate data from Section to AppSection (ignore duplicates in test data)
INSERT IGNORE INTO `AppSection` (`id`, `app_module_id`, `key`, `name`, `created_at`, `updated_at`, `deleted_at`)
SELECT `id`, `module_id`, `name`, `name`, `created_at`, `updated_at`, `deleted_at`
FROM `Section`;

-- Add app_module_id column as nullable first
ALTER TABLE `PlanModule` ADD COLUMN `app_module_id` INTEGER NULL;

-- Copy existing module_id values to app_module_id
UPDATE `PlanModule` SET `app_module_id` = `module_id` WHERE `module_id` IS NOT NULL;

-- Make app_module_id required
ALTER TABLE `PlanModule` MODIFY `app_module_id` INTEGER NOT NULL;

-- Drop foreign key and column for old module_id
ALTER TABLE `PlanModule` DROP FOREIGN KEY `PlanModule_module_id_fkey`;
ALTER TABLE `PlanModule` DROP INDEX `PlanModule_module_id_fkey`;
ALTER TABLE `PlanModule` DROP COLUMN `module_id`;

-- Add new foreign key and unique constraint
ALTER TABLE `PlanModule` ADD CONSTRAINT `PlanModule_app_module_id_fkey` FOREIGN KEY (`app_module_id`) REFERENCES `AppModule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX `PlanModule_plan_id_app_module_id_key` ON `PlanModule`(`plan_id`, `app_module_id`);

-- Add foreign key for AppSection
ALTER TABLE `AppSection` ADD CONSTRAINT `AppSection_app_module_id_fkey` FOREIGN KEY (`app_module_id`) REFERENCES `AppModule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Create PlanSection table
CREATE TABLE `PlanSection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plan_id` INTEGER NOT NULL,
    `app_section_id` INTEGER NOT NULL,

    UNIQUE INDEX `PlanSection_plan_id_app_section_id_key`(`plan_id`, `app_section_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PlanSection` ADD CONSTRAINT `PlanSection_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `Plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PlanSection` ADD CONSTRAINT `PlanSection_app_section_id_fkey` FOREIGN KEY (`app_section_id`) REFERENCES `AppSection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add display_name to User and unique on username
ALTER TABLE `User` ADD COLUMN `display_name` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);

-- Create Role and UserRole tables
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserRole` (
    `user_id` VARCHAR(191) NOT NULL,
    `role_id` INTEGER NOT NULL,

    INDEX `UserRole_role_id_idx`(`role_id`),
    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old tables
DROP TABLE IF EXISTS `Section`;
DROP TABLE IF EXISTS `Module`;
