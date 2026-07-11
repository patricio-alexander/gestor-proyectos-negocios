-- AlterTable
ALTER TABLE `Module` ADD COLUMN `end_trial` DATETIME(3) NULL,
    ADD COLUMN `is_trial` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `limit_days_trial` INTEGER NULL,
    ADD COLUMN `start_trial` DATETIME(3) NULL;
