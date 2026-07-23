-- CreateTable
CREATE TABLE `MobileDevice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mobile_app_id` INTEGER NOT NULL,
    `device_id` VARCHAR(64) NOT NULL,
    `platform` ENUM('ios', 'android') NOT NULL,
    `app_version` VARCHAR(50) NOT NULL,
    `latest_version_seen` VARCHAR(50) NULL,
    `os_version` VARCHAR(50) NULL,
    `model` VARCHAR(120) NULL,
    `label` VARCHAR(120) NULL,
    `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `MobileDevice_mobile_app_id_device_id_key`(`mobile_app_id`, `device_id`),
    INDEX `MobileDevice_mobile_app_id_last_seen_at_idx`(`mobile_app_id`, `last_seen_at`),
    INDEX `MobileDevice_mobile_app_id_platform_idx`(`mobile_app_id`, `platform`),
    INDEX `MobileDevice_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MobileDevice` ADD CONSTRAINT `MobileDevice_mobile_app_id_fkey` FOREIGN KEY (`mobile_app_id`) REFERENCES `MobileApp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
