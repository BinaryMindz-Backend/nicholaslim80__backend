/*
  Warnings:

  - Added the required column `discounttype` to the `PromaCodeUses` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `discountAmount` on the `PromaCodeUses` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "PromaCodeUses" ADD COLUMN     "discounttype" "DiscountType" NOT NULL,
DROP COLUMN "discountAmount",
ADD COLUMN     "discountAmount" INTEGER NOT NULL;
