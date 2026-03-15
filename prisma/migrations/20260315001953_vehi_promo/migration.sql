/*
  Warnings:

  - Added the required column `discountDesc` to the `PromoCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `redirectLink` to the `PromoCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "discountDesc" TEXT NOT NULL,
ADD COLUMN     "redirectLink" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vehicle_types" ADD COLUMN     "vehicle_desc" TEXT;
