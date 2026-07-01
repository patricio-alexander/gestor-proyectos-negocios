-- 1. PlanModule: drop foreign keys referencing tables about to be renamed/dropped
ALTER TABLE `PlanModule` DROP FOREIGN KEY `PlanModule_app_module_id_fkey`;
ALTER TABLE `PlanModule` DROP FOREIGN KEY `PlanModule_plan_id_fkey`;
DROP INDEX `PlanModule_app_module_id_fkey` ON `PlanModule`;
DROP INDEX `PlanModule_plan_id_app_module_id_key` ON `PlanModule`;

-- 2. Drop foreign keys referencing old table names
ALTER TABLE `ApiKey` DROP FOREIGN KEY `ApiKey_business_id_fkey`;
ALTER TABLE `Subscription` DROP FOREIGN KEY `Subscription_business_hash_fkey`;
ALTER TABLE `Plan` DROP FOREIGN KEY `Plan_business_id_fkey`;
ALTER TABLE `PlanPrice` DROP FOREIGN KEY `PlanPrice_plan_id_fkey`;

-- 3. Drop legacy tables
DROP TABLE IF EXISTS `PlanSection`;
DROP TABLE IF EXISTS `AppSection`;
DROP TABLE IF EXISTS `AppModule`;

-- 4. Rename tables (preserves all data)
RENAME TABLE `Business` TO `Apps`;
RENAME TABLE `BusinessModule` TO `Module`;
RENAME TABLE `BusinessModuleSection` TO `Seccion`;

-- 5. Rebuild PlanModule: drop app_module_id, restore module_id
ALTER TABLE `PlanModule` ADD COLUMN `module_id` INTEGER NULL;
UPDATE `PlanModule` SET `module_id` = `app_module_id`;
ALTER TABLE `PlanModule` MODIFY `module_id` INTEGER NOT NULL;
ALTER TABLE `PlanModule` DROP COLUMN `app_module_id`;

CREATE INDEX `PlanModule_plan_id_idx` ON `PlanModule`(`plan_id`);
CREATE INDEX `PlanModule_module_id_idx` ON `PlanModule`(`module_id`);

-- 6. Re-add foreign keys with new table names
ALTER TABLE `ApiKey` ADD CONSTRAINT `ApiKey_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `Apps`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_business_hash_fkey` FOREIGN KEY (`business_hash`) REFERENCES `Apps`(`hash`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Plan` ADD CONSTRAINT `Plan_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `Apps`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PlanPrice` ADD CONSTRAINT `PlanPrice_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `Plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PlanModule` ADD CONSTRAINT `PlanModule_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `Plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PlanModule` ADD CONSTRAINT `PlanModule_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `Module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Module` ADD CONSTRAINT `Module_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `Apps`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Seccion` ADD CONSTRAINT `Seccion_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `Module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
