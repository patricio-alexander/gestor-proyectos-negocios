-- Extiende LifecycleStatus con `hidden` (Oculto) en todas las columnas que lo usan.
ALTER TABLE `Module`
  MODIFY COLUMN `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned', 'hidden') NOT NULL DEFAULT 'active';

ALTER TABLE `Section`
  MODIFY COLUMN `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned', 'hidden') NOT NULL DEFAULT 'active';

ALTER TABLE `AppModule`
  MODIFY COLUMN `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned', 'hidden') NULL;

ALTER TABLE `AppSection`
  MODIFY COLUMN `status` ENUM('active', 'development', 'maintenance', 'developer', 'planned', 'hidden') NULL;
