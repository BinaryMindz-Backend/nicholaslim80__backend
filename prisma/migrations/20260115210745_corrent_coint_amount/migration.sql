/*
  Warnings:

  - You are about to alter the column `coin_value_in_cent` on the `coins` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - Made the column `coin_value_in_cent` on table `coins` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "coins" ALTER COLUMN "coin_value_in_cent" SET NOT NULL,
ALTER COLUMN "coin_value_in_cent" SET DEFAULT 0.0,
ALTER COLUMN "coin_value_in_cent" SET DATA TYPE DECIMAL(10,2);
