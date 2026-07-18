-- AlterTable
ALTER TABLE `AppWebhookEvent`
    ADD COLUMN `event_id` INTEGER NULL,
    ADD COLUMN `processed_at` DATETIME(3) NULL,
    ADD COLUMN `error` VARCHAR(500) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `AppWebhookEvent_event_id_key` ON `AppWebhookEvent`(`event_id`);
CREATE INDEX `AppWebhookEvent_event_id_idx` ON `AppWebhookEvent`(`event_id`);

-- AddForeignKey
ALTER TABLE `AppWebhookEvent` ADD CONSTRAINT `AppWebhookEvent_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
