/*
  Warnings:

  - You are about to drop the column `is_promo_used` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "is_promo_used",
ADD COLUMN     "useCoins" BOOLEAN NOT NULL DEFAULT false;
