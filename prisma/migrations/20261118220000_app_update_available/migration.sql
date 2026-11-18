-- update_available: aviso opcional sin bloquear la app
SET @db := DATABASE();

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Apps' AND COLUMN_NAME = 'update_available'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `Apps` ADD COLUMN `update_available` BOOLEAN NOT NULL DEFAULT false',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
