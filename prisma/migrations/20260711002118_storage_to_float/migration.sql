/*
  Warnings:

  - You are about to alter the column `database_size` on the `Apps` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - You are about to alter the column `images_size` on the `Apps` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `Apps` MODIFY `database_size` DOUBLE NULL,
    MODIFY `images_size` DOUBLE NULL;
