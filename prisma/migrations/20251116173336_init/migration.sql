/*
  Warnings:

  - The values [MOTORBIKE] on the enum `VehicleTypeEnum` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `vehicle_type` to the `vehicle_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VehicleTypeEnum_new" AS ENUM ('CAR', 'TRUCK', 'MOTORCYCLE', 'BUS', 'VAN', 'BICYCLE', 'SUV', 'TRACTOR', 'ELECTRIC_SCOOTER', 'OTHER');
ALTER TABLE "raider_registrations" ALTER COLUMN "vehicle_type" TYPE "VehicleTypeEnum_new" USING ("vehicle_type"::text::"VehicleTypeEnum_new");
ALTER TABLE "vehicle_types" ALTER COLUMN "vehicle_type" TYPE "VehicleTypeEnum_new" USING ("vehicle_type"::text::"VehicleTypeEnum_new");
ALTER TYPE "VehicleTypeEnum" RENAME TO "VehicleTypeEnum_old";
ALTER TYPE "VehicleTypeEnum_new" RENAME TO "VehicleTypeEnum";
DROP TYPE "public  // for docker"."VehicleTypeEnum_old";
COMMIT;

-- AlterTable
ALTER TABLE "vehicle_types" DROP COLUMN "vehicle_type",
ADD COLUMN     "vehicle_type" "VehicleTypeEnum" NOT NULL;
