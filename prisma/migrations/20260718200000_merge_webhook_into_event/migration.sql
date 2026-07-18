-- Event unificado (webhook + api)
ALTER TABLE `Event`
    ADD COLUMN `payload` JSON NULL,
    ADD COLUMN `source` ENUM('api', 'webhook') NOT NULL DEFAULT 'api';

CREATE INDEX `Event_source_idx` ON `Event`(`source`);

DROP TABLE IF EXISTS `AppWebhookEvent`;
