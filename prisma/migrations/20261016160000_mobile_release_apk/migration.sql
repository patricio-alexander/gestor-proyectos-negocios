-- APK opcional en releases OTA (instalación con confirmación del usuario).
ALTER TABLE `MobileAppRelease`
  ADD COLUMN `apk_path` VARCHAR(500) NULL AFTER `bundle_path`;

-- Permitir releases solo-APK (sin bundle JS).
ALTER TABLE `MobileAppRelease`
  MODIFY `bundle_path` VARCHAR(500) NULL;
