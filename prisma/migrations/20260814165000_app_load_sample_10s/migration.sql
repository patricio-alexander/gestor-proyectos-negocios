-- Fuente histórica de telemetría: cada app reporta un bucket de 10 segundos.
-- Los resúmenes por minuto, hora y día se calculan a partir de estos registros.
CREATE TABLE `AppLoadSample` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `app_id` INTEGER NOT NULL,
    `interval_start` DATETIME(3) NOT NULL,
    `requests` INTEGER NOT NULL DEFAULT 0,
    `bytes_in` BIGINT NOT NULL DEFAULT 0,
    `bytes_out` BIGINT NOT NULL DEFAULT 0,
    `errors` INTEGER NOT NULL DEFAULT 0,
    `latency_p95_ms` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AppLoadSample_app_id_interval_start_key`(`app_id`, `interval_start`),
    INDEX `AppLoadSample_app_id_interval_start_idx`(`app_id`, `interval_start`),
    INDEX `AppLoadSample_interval_start_idx`(`interval_start`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AppLoadSample`
  ADD CONSTRAINT `AppLoadSample_app_id_fkey`
  FOREIGN KEY (`app_id`) REFERENCES `Apps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
