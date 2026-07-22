-- CreateTable
CREATE TABLE `MobileApp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `api_key` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `MobileApp_key_key`(`key`),
    UNIQUE INDEX `MobileApp_api_key_key`(`api_key`),
    INDEX `MobileApp_deleted_at_idx`(`deleted_at`),
    INDEX `MobileApp_api_key_idx`(`api_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MobileAppRelease` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mobile_app_id` INTEGER NOT NULL,
    `platform` ENUM('ios', 'android') NOT NULL,
    `version` VARCHAR(50) NOT NULL,
    `bundle_path` VARCHAR(500) NOT NULL,
    `mandatory` BOOLEAN NOT NULL DEFAULT false,
    `release_notes` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `MobileAppRelease_mobile_app_id_platform_is_active_idx`(`mobile_app_id`, `platform`, `is_active`),
    INDEX `MobileAppRelease_mobile_app_id_deleted_at_idx`(`mobile_app_id`, `deleted_at`),
    INDEX `MobileAppRelease_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `MobileAppRelease_mobile_app_id_platform_version_key`(`mobile_app_id`, `platform`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MobileAppRelease` ADD CONSTRAINT `MobileAppRelease_mobile_app_id_fkey` FOREIGN KEY (`mobile_app_id`) REFERENCES `MobileApp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
