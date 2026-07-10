/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `EventType` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Apps` ADD COLUMN `database_size` INTEGER NULL,
    ADD COLUMN `images_size` INTEGER NULL,
    ADD COLUMN `path` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `EventType_name_key` ON `EventType`(`name`);
