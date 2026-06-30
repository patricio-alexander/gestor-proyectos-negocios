-- AlterTable: add business_id as nullable first
ALTER TABLE `Module` ADD COLUMN `business_id` INTEGER NULL;

-- Assign existing modules to the first business
UPDATE `Module` SET `business_id` = 1 WHERE `business_id` IS NULL;

-- Now make it required
ALTER TABLE `Module` MODIFY `business_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `business_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Module` ADD CONSTRAINT `Module_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `Business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
