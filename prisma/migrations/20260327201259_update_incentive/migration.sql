/*
  Warnings:

  - You are about to drop the column `serviceZoneId` on the `incentives` table. All the data in the column will be lost.
  - Added the required column `claim_expire` to the `incentives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_clam` to the `incentives` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "incentives" DROP CONSTRAINT "incentives_serviceZoneId_fkey";

-- AlterTable
ALTER TABLE "incentives" DROP COLUMN "serviceZoneId",
ADD COLUMN     "claim_expire" INTEGER NOT NULL,
ADD COLUMN     "max_clam" INTEGER NOT NULL,
ADD COLUMN     "time_constant" "TimeUnit" NOT NULL DEFAULT 'HOURS';

-- CreateTable
CREATE TABLE "_IncentiveZones" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_IncentiveZones_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_IncentiveZones_B_index" ON "_IncentiveZones"("B");

-- AddForeignKey
ALTER TABLE "_IncentiveZones" ADD CONSTRAINT "_IncentiveZones_A_fkey" FOREIGN KEY ("A") REFERENCES "incentives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IncentiveZones" ADD CONSTRAINT "_IncentiveZones_B_fkey" FOREIGN KEY ("B") REFERENCES "serviceZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
