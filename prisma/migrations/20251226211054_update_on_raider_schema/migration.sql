/*
  Warnings:

  - The `rank` column on the `Raider` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `raiderId` to the `my_raiders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Rank" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'PREMIUM');

-- AlterTable
ALTER TABLE "Raider" ADD COLUMN     "active_days" INTEGER DEFAULT 0,
ADD COLUMN     "cancellation_rate" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "completed_orders" INTEGER DEFAULT 0,
ADD COLUMN     "hasAdDecal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasBranding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rankScore" INTEGER,
DROP COLUMN "rank",
ADD COLUMN     "rank" "Rank";

-- AlterTable
ALTER TABLE "my_raiders" ADD COLUMN     "raiderId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "my_raiders" ADD CONSTRAINT "my_raiders_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
