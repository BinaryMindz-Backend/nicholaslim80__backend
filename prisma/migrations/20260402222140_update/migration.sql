/*
  Warnings:

  - You are about to drop the column `driver_type_id` on the `incentives` table. All the data in the column will be lost.
  - You are about to drop the column `driver_type_name` on the `incentives` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "incentives" DROP CONSTRAINT "incentives_driver_type_id_fkey";

-- AlterTable
ALTER TABLE "incentives" DROP COLUMN "driver_type_id",
DROP COLUMN "driver_type_name";

-- CreateTable
CREATE TABLE "_IncentiveVehicleTypes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_IncentiveVehicleTypes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_IncentiveVehicleTypes_B_index" ON "_IncentiveVehicleTypes"("B");

-- AddForeignKey
ALTER TABLE "_IncentiveVehicleTypes" ADD CONSTRAINT "_IncentiveVehicleTypes_A_fkey" FOREIGN KEY ("A") REFERENCES "incentives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IncentiveVehicleTypes" ADD CONSTRAINT "_IncentiveVehicleTypes_B_fkey" FOREIGN KEY ("B") REFERENCES "vehicle_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
