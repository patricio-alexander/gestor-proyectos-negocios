-- Rename table `Seccion` to `Section`
-- First drop all foreign keys on `Seccion`
ALTER TABLE `Seccion` DROP FOREIGN KEY `BusinessModuleSection_module_id_fkey`;
ALTER TABLE `Seccion` DROP FOREIGN KEY `Seccion_module_id_fkey`;

-- Rename the table
RENAME TABLE `Seccion` TO `Section`;

-- Re-add the foreign key with the new table name
ALTER TABLE `Section` ADD CONSTRAINT `Section_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `Module` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
