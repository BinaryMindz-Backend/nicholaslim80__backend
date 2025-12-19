/*
  Warnings:

  - You are about to alter the column `currentWalletBalance` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `totalWalletBalance` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "currentWalletBalance" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "totalWalletBalance" SET DATA TYPE DOUBLE PRECISION;
