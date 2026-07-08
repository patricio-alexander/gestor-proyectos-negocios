-- AlterTable
ALTER TABLE `Apps` ADD COLUMN `maintenance` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Section` ADD COLUMN `usage_count` INTEGER NOT NULL DEFAULT 0;
