-- AlterTable
ALTER TABLE `Apps` ADD COLUMN `entitlement_secret` VARCHAR(255) NULL,
    ADD COLUMN `entitlement_url` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `Module` ADD COLUMN `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned') NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE `Plan` ADD COLUMN `sort_order` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Section` ADD COLUMN `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned') NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE INDEX `Module_status_idx` ON `Module`(`status`);

-- CreateIndex
CREATE INDEX `Section_status_idx` ON `Section`(`status`);
