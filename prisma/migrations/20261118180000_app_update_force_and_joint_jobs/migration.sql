-- update_force + JointUpdateJob (idempotente: seguro si ya se aplicó con db push)

SET @db := DATABASE();

-- Apps.update_force
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Apps' AND COLUMN_NAME = 'update_force'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `Apps` ADD COLUMN `update_force` BOOLEAN NOT NULL DEFAULT true',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- JointUpdateJob
SET @tbl_exists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'JointUpdateJob'
);
SET @sql := IF(
  @tbl_exists = 0,
  'CREATE TABLE `JointUpdateJob` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `run_at` DATETIME(3) NOT NULL,
    `policy` ENUM(''forced'', ''optional'') NOT NULL DEFAULT ''forced'',
    `deploy` BOOLEAN NOT NULL DEFAULT true,
    `notify` BOOLEAN NOT NULL DEFAULT true,
    `targets` JSON NOT NULL,
    `status` ENUM(''pending'', ''running'', ''done'', ''failed'', ''cancelled'') NOT NULL DEFAULT ''pending'',
    `result` JSON NULL,
    `error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `started_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    INDEX `JointUpdateJob_status_run_at_idx`(`status`, `run_at`),
    PRIMARY KEY (`id`)
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
