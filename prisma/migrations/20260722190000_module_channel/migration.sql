-- Módulos por canal: web (default) | mobile

ALTER TABLE `Module`
  ADD COLUMN `channel` ENUM('web', 'mobile') NOT NULL DEFAULT 'web';

CREATE INDEX `Module_channel_deleted_at_idx` ON `Module`(`channel`, `deleted_at`);
