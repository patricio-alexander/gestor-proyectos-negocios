ALTER TABLE `Plan`
  ADD COLUMN `channel` ENUM('web', 'mobile') NOT NULL DEFAULT 'web';

CREATE INDEX `Plan_channel_deleted_at_idx` ON `Plan`(`channel`, `deleted_at`);
