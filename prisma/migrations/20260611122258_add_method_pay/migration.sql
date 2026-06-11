-- CreateTable
CREATE TABLE `ApiKey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `prefix` VARCHAR(191) NOT NULL,
    `hash` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ApiKey_prefix_key`(`prefix`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Business` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `ruc` VARCHAR(191) NULL,
    MODIFY `hash` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Business_hash_key` ON `Business`(`hash`);

-- AlterTable
ALTER TABLE `License` ADD COLUMN `method_pay` ENUM('CASH', 'TRANSFER') NULL;

-- AlterTable
ALTER TABLE `Module` ADD COLUMN `key` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Module_key_key` ON `Module`(`key`);

-- AlterTable
ALTER TABLE `Subscription` DROP FOREIGN KEY `Subscription_business_id_fkey`,
    DROP INDEX `Subscription_business_id_fkey`,
    DROP COLUMN `business_id`,
    ADD COLUMN `business_hash` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Subscription_business_hash_idx` ON `Subscription`(`business_hash`);

-- AddForeignKey
ALTER TABLE `ApiKey` ADD CONSTRAINT `ApiKey_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `Business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_business_hash_fkey` FOREIGN KEY (`business_hash`) REFERENCES `Business`(`hash`) ON DELETE RESTRICT ON UPDATE CASCADE;
