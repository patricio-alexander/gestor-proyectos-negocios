-- Link MobileApp → Apps (kind=mobile) for module/section lifecycle control

ALTER TABLE `Apps`
  MODIFY `kind` ENUM('template', 'deployment', 'mobile') NOT NULL DEFAULT 'deployment';

ALTER TABLE `MobileApp`
  ADD COLUMN `app_id` INTEGER NULL;

CREATE UNIQUE INDEX `MobileApp_app_id_key` ON `MobileApp`(`app_id`);

ALTER TABLE `MobileApp`
  ADD CONSTRAINT `MobileApp_app_id_fkey`
  FOREIGN KEY (`app_id`) REFERENCES `Apps`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
