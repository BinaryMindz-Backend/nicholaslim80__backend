/*
  Warnings:

  - Changed the type of `vehicle_type` on the `vehicle_types` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "vehicle_types" ADD COLUMN     "vehicle_name" TEXT,
DROP COLUMN "vehicle_type",
ADD COLUMN     "vehicle_type" "VehicleTypeEnum" NOT NULL;
