/*
  Warnings:

  - You are about to drop the column `service_area` on the `RaiderCompensationRole` table. All the data in the column will be lost.
  - You are about to drop the column `service_area` on the `RaiderDeductionFee` table. All the data in the column will be lost.
  - You are about to drop the column `service_area` on the `StandardCommissionRate` table. All the data in the column will be lost.
  - You are about to drop the column `service_area` on the `UserFeeStructure` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RaiderCompensationRole" DROP COLUMN "service_area",
ADD COLUMN     "service_area_id" INTEGER;

-- AlterTable
ALTER TABLE "RaiderDeductionFee" DROP COLUMN "service_area";

-- AlterTable
ALTER TABLE "StandardCommissionRate" DROP COLUMN "service_area",
ADD COLUMN     "service_area_id" INTEGER;

-- AlterTable
ALTER TABLE "UserFeeStructure" DROP COLUMN "service_area",
ADD COLUMN     "service_area_id" INTEGER;

-- AddForeignKey
ALTER TABLE "StandardCommissionRate" ADD CONSTRAINT "StandardCommissionRate_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "serviceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaiderCompensationRole" ADD CONSTRAINT "RaiderCompensationRole_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "serviceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeeStructure" ADD CONSTRAINT "UserFeeStructure_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "serviceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
