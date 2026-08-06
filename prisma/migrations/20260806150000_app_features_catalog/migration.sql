-- Catálogo de funciones de producto + override por app (ciclo de vida).
CREATE TABLE `Feature` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned', 'hidden') NOT NULL DEFAULT 'planned',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `Feature_key_key`(`key`),
    INDEX `Feature_status_idx`(`status`),
    INDEX `Feature_deleted_at_idx`(`deleted_at`),
    INDEX `Feature_sort_order_deleted_at_idx`(`sort_order`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AppFeature` (
    `app_id` INTEGER NOT NULL,
    `feature_id` INTEGER NOT NULL,
    `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned', 'hidden') NULL,

    INDEX `AppFeature_app_id_idx`(`app_id`),
    INDEX `AppFeature_feature_id_idx`(`feature_id`),
    INDEX `AppFeature_feature_id_status_idx`(`feature_id`, `status`),
    PRIMARY KEY (`app_id`, `feature_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AppFeature` ADD CONSTRAINT `AppFeature_app_id_fkey` FOREIGN KEY (`app_id`) REFERENCES `Apps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AppFeature` ADD CONSTRAINT `AppFeature_feature_id_fkey` FOREIGN KEY (`feature_id`) REFERENCES `Feature`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
