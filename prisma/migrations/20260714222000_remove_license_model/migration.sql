-- DropForeignKey
ALTER TABLE `License` DROP FOREIGN KEY `License_plan_price_id_fkey`;

-- DropForeignKey
ALTER TABLE `License` DROP FOREIGN KEY `License_sub_id_fkey`;

-- DropTable
DROP TABLE `License`;
