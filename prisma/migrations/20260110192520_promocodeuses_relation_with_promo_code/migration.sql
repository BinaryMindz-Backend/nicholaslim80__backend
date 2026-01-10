/*
  Warnings:

  - Changed the type of `promoCodeId` on the `PromaCodeUses` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "PromaCodeUses" DROP COLUMN "promoCodeId",
ADD COLUMN     "promoCodeId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "PromaCodeUses" ADD CONSTRAINT "PromaCodeUses_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
