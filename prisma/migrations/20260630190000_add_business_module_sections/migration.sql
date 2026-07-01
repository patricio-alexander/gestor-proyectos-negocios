-- Create BusinessModuleSection table
CREATE TABLE `BusinessModuleSection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `module_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `BusinessModuleSection_module_id_idx`(`module_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BusinessModuleSection` ADD CONSTRAINT `BusinessModuleSection_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `BusinessModule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
