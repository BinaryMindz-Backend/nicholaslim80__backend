/*
  Warnings:

  - You are about to drop the column `refer_code` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[referral_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "refer_code",
ADD COLUMN     "referral_code" TEXT,
ADD COLUMN     "referral_link" TEXT,
ADD COLUMN     "referred_by_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_id_fkey" FOREIGN KEY ("referred_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
