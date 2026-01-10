/*
  Warnings:

  - A unique constraint covering the columns `[promoCode]` on the table `PromoCode` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_promoCode_key" ON "PromoCode"("promoCode");
