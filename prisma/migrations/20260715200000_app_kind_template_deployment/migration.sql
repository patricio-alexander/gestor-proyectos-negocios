-- AlterTable
ALTER TABLE `Apps` ADD COLUMN `kind` ENUM('template', 'deployment') NOT NULL DEFAULT 'deployment';
