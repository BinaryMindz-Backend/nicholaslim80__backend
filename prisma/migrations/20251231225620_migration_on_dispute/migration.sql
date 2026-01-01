/*
  Warnings:

  - You are about to drop the column `userPercent` on the `disputes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "disputes" DROP COLUMN "userPercent",
ADD COLUMN     "companyPercent" INTEGER;
