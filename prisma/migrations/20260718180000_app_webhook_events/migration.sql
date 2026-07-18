-- CreateTable
CREATE TABLE `AppWebhookEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `app_id` INTEGER NOT NULL,
    `event_type` VARCHAR(120) NULL,
    `payload` JSON NOT NULL,
    `received_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AppWebhookEvent_app_id_received_at_idx`(`app_id`, `received_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AppWebhookEvent` ADD CONSTRAINT `AppWebhookEvent_app_id_fkey` FOREIGN KEY (`app_id`) REFERENCES `Apps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
