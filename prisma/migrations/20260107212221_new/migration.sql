/*
  Warnings:

  - You are about to alter the column `latitude` on the `raider_location_history` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,7)` to `Integer`.
  - You are about to alter the column `longitude` on the `raider_location_history` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,7)` to `Integer`.
  - You are about to drop the column `balance` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "raider_location_history" ALTER COLUMN "latitude" SET DATA TYPE INTEGER,
ALTER COLUMN "longitude" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "balance";
