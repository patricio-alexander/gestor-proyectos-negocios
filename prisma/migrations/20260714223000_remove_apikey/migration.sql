-- DropForeignKey
ALTER TABLE `ApiKey` DROP FOREIGN KEY `ApiKey_app_id_fkey`;

-- DropTable
DROP TABLE `ApiKey`;
