-- CreateTable
CREATE TABLE `Capability` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `section_id` INTEGER NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Capability_section_id_idx`(`section_id`),
    UNIQUE INDEX `Capability_section_id_code_key`(`section_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Capability` ADD CONSTRAINT `Capability_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `Section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
