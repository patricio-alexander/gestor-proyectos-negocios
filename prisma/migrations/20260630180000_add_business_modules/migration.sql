-- Create BusinessModule table
CREATE TABLE `BusinessModule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `BusinessModule_business_id_key_key`(`business_id`, `key`),
    INDEX `BusinessModule_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BusinessModule` ADD CONSTRAINT `BusinessModule_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `Business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
