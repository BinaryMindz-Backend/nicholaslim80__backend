/*
  Warnings:

  - You are about to alter the column `incentive_amount` on the `incentives` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "incentives" ALTER COLUMN "incentive_amount" SET DEFAULT 0,
ALTER COLUMN "incentive_amount" SET DATA TYPE INTEGER;
