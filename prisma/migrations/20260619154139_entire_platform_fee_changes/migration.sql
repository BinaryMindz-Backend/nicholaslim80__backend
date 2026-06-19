/*
  Warnings:

  - You are about to drop the column `service_area_id` on the `RaiderCompensationRole` table. All the data in the column will be lost.
  - You are about to drop the column `service_area_id` on the `StandardCommissionRate` table. All the data in the column will be lost.
  - You are about to drop the column `service_area_id` on the `UserFeeStructure` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "RaiderCompensationRole" DROP CONSTRAINT "RaiderCompensationRole_service_area_id_fkey";

-- DropForeignKey
ALTER TABLE "StandardCommissionRate" DROP CONSTRAINT "StandardCommissionRate_service_area_id_fkey";

-- DropForeignKey
ALTER TABLE "UserFeeStructure" DROP CONSTRAINT "UserFeeStructure_service_area_id_fkey";

-- AlterTable
ALTER TABLE "RaiderCompensationRole" DROP COLUMN "service_area_id";

-- AlterTable
ALTER TABLE "StandardCommissionRate" DROP COLUMN "service_area_id";

-- AlterTable
ALTER TABLE "UserFeeStructure" DROP COLUMN "service_area_id";

-- CreateTable
CREATE TABLE "StandardCommissionRateZone" (
    "id" SERIAL NOT NULL,
    "standard_commission_rate_id" INTEGER NOT NULL,
    "service_area_id" INTEGER NOT NULL,

    CONSTRAINT "StandardCommissionRateZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaiderCompensationRoleZone" (
    "id" SERIAL NOT NULL,
    "raider_compensation_id" INTEGER NOT NULL,
    "service_area_id" INTEGER NOT NULL,

    CONSTRAINT "RaiderCompensationRoleZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaiderDeductionFeeZone" (
    "id" SERIAL NOT NULL,
    "raider_deduction_id" INTEGER NOT NULL,
    "service_area_id" INTEGER NOT NULL,

    CONSTRAINT "RaiderDeductionFeeZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeeStructureZone" (
    "id" SERIAL NOT NULL,
    "user_fee_structure_id" INTEGER NOT NULL,
    "service_area_id" INTEGER NOT NULL,

    CONSTRAINT "UserFeeStructureZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDynamicSurgeZone" (
    "id" SERIAL NOT NULL,
    "user_dynamic_surge_id" INTEGER NOT NULL,
    "service_area_id" INTEGER NOT NULL,

    CONSTRAINT "UserDynamicSurgeZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StandardCommissionRateZone_standard_commission_rate_id_serv_key" ON "StandardCommissionRateZone"("standard_commission_rate_id", "service_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "RaiderCompensationRoleZone_raider_compensation_id_service_a_key" ON "RaiderCompensationRoleZone"("raider_compensation_id", "service_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "RaiderDeductionFeeZone_raider_deduction_id_service_area_id_key" ON "RaiderDeductionFeeZone"("raider_deduction_id", "service_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserFeeStructureZone_user_fee_structure_id_service_area_id_key" ON "UserFeeStructureZone"("user_fee_structure_id", "service_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserDynamicSurgeZone_user_dynamic_surge_id_service_area_id_key" ON "UserDynamicSurgeZone"("user_dynamic_surge_id", "service_area_id");

-- AddForeignKey
ALTER TABLE "StandardCommissionRateZone" ADD CONSTRAINT "StandardCommissionRateZone_standard_commission_rate_id_fkey" FOREIGN KEY ("standard_commission_rate_id") REFERENCES "StandardCommissionRate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardCommissionRateZone" ADD CONSTRAINT "StandardCommissionRateZone_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "serviceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaiderCompensationRoleZone" ADD CONSTRAINT "RaiderCompensationRoleZone_raider_compensation_id_fkey" FOREIGN KEY ("raider_compensation_id") REFERENCES "RaiderCompensationRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaiderCompensationRoleZone" ADD CONSTRAINT "RaiderCompensationRoleZone_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "serviceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaiderDeductionFeeZone" ADD CONSTRAINT "RaiderDeductionFeeZone_raider_deduction_id_fkey" FOREIGN KEY ("raider_deduction_id") REFERENCES "RaiderDeductionFee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaiderDeductionFeeZone" ADD CONSTRAINT "RaiderDeductionFeeZone_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "serviceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeeStructureZone" ADD CONSTRAINT "UserFeeStructureZone_user_fee_structure_id_fkey" FOREIGN KEY ("user_fee_structure_id") REFERENCES "UserFeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeeStructureZone" ADD CONSTRAINT "UserFeeStructureZone_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "serviceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDynamicSurgeZone" ADD CONSTRAINT "UserDynamicSurgeZone_user_dynamic_surge_id_fkey" FOREIGN KEY ("user_dynamic_surge_id") REFERENCES "UserDynamicSurge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDynamicSurgeZone" ADD CONSTRAINT "UserDynamicSurgeZone_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "serviceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
