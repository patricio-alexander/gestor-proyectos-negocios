/*
  Warnings:

  - Added the required column `plan_price_id` to the `License` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `License` DROP FOREIGN KEY `License_sub_id_fkey`;

-- DropIndex
DROP INDEX `License_sub_id_fkey` ON `License`;

-- AlterTable
ALTER TABLE `License` ADD COLUMN `plan_price_id` INTEGER NOT NULL,
    MODIFY `sub_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `License` ADD CONSTRAINT `License_sub_id_fkey` FOREIGN KEY (`sub_id`) REFERENCES `Subscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `License` ADD CONSTRAINT `License_plan_price_id_fkey` FOREIGN KEY (`plan_price_id`) REFERENCES `PlanPrice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
