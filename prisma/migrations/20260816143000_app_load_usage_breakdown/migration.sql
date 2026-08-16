-- Desglose agregado por módulo/sección para cada bucket de telemetría.
-- JSON conserva el ranking enviado por la app sin guardar rutas ni datos sensibles.
ALTER TABLE `AppLoadSample`
  ADD COLUMN `usage_breakdown` JSON NULL;

ALTER TABLE `AppLoadMinute`
  ADD COLUMN `usage_breakdown` JSON NULL;
