SET @db := DATABASE();

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Apps' AND COLUMN_NAME = 'reported_version'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `Apps` ADD COLUMN `reported_version` VARCHAR(40) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
