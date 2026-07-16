-- DropForeignKey
ALTER TABLE `Module` DROP FOREIGN KEY `Module_app_id_fkey`;

-- DropIndex
DROP INDEX `Module_app_id_idx` ON `Module`;

-- DropIndex
DROP INDEX `Module_app_id_key_key` ON `Module`;

-- AlterTable
ALTER TABLE `Module` DROP COLUMN `app_id`;

-- CreateIndex
CREATE UNIQUE INDEX `Module_key_key` ON `Module`(`key`);
