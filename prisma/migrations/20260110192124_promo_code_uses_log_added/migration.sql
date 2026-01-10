/*
  Warnings:

  - Added the required column `expires_at` to the `PromoCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "PromaCodeUses" (
    "id" SERIAL NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "discountAmount" "DiscountType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromaCodeUses_pkey" PRIMARY KEY ("id")
);
