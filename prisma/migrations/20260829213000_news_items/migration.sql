-- Noticias del control plane + apps destino (push a EdDeli / Store / Tienda).

CREATE TABLE `NewsItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(220) NOT NULL,
    `subtitle` VARCHAR(400) NULL,
    `body` TEXT NULL,
    `kind` ENUM('portada', 'interior', 'breve', 'editorial', 'proximamente') NOT NULL DEFAULT 'interior',
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `NewsItem_kind_is_published_deleted_at_idx`(`kind`, `is_published`, `deleted_at`),
    INDEX `NewsItem_is_published_published_at_idx`(`is_published`, `published_at`),
    INDEX `NewsItem_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NewsAppTarget` (
    `news_id` INTEGER NOT NULL,
    `app_id` INTEGER NOT NULL,
    `pushed_at` DATETIME(3) NULL,
    `push_ok` BOOLEAN NULL,

    INDEX `NewsAppTarget_app_id_idx`(`app_id`),
    INDEX `NewsAppTarget_news_id_idx`(`news_id`),
    PRIMARY KEY (`news_id`, `app_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `NewsAppTarget`
  ADD CONSTRAINT `NewsAppTarget_news_id_fkey`
  FOREIGN KEY (`news_id`) REFERENCES `NewsItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `NewsAppTarget`
  ADD CONSTRAINT `NewsAppTarget_app_id_fkey`
  FOREIGN KEY (`app_id`) REFERENCES `Apps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
