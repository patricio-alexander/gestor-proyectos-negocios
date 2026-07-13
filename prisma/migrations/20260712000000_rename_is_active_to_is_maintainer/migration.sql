-- Rename is_active to is_maintainer (semantics changed from "active" to "under maintenance")
ALTER TABLE `Module` CHANGE COLUMN `is_active` `is_maintainer` TINYINT(1) NOT NULL DEFAULT 0;

-- Set all existing modules to not be under maintenance since the semantics changed
UPDATE `Module` SET `is_maintainer` = 0 WHERE `is_maintainer` = 1;
