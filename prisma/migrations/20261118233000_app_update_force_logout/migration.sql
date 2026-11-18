-- Cerrar sesión forzosamente al terminar update (opcional, check en el gestor).
ALTER TABLE `Apps` ADD COLUMN `update_force_logout` BOOLEAN NOT NULL DEFAULT false;
