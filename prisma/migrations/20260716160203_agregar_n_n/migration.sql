/*
  Warnings:

  - You are about to drop the column `app_id` on the `Plan` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Plan` DROP FOREIGN KEY `Plan_app_id_fkey`;

-- DropIndex
DROP INDEX `Plan_app_id_fkey` ON `Plan`;

-- AlterTable
ALTER TABLE `Plan` DROP COLUMN `app_id`;

-- CreateTable
CREATE TABLE `AppPlan` (
    `app_id` INTEGER NOT NULL,
    `plan_id` INTEGER NOT NULL,

    INDEX `AppPlan_app_id_idx`(`app_id`),
    INDEX `AppPlan_plan_id_idx`(`plan_id`),
    PRIMARY KEY (`app_id`, `plan_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AppPlan` ADD CONSTRAINT `AppPlan_app_id_fkey` FOREIGN KEY (`app_id`) REFERENCES `Apps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppPlan` ADD CONSTRAINT `AppPlan_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `Plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
