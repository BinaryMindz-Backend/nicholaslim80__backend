/*
  Warnings:

  - You are about to drop the column `driver_type` on the `incentives` table. All the data in the column will be lost.
  - Added the required column `driver_type_id` to the `incentives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driver_type_name` to the `incentives` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "incentives" DROP COLUMN "driver_type",
ADD COLUMN     "driver_type_id" INTEGER NOT NULL,
ADD COLUMN     "driver_type_name" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "incentives" ADD CONSTRAINT "incentives_driver_type_id_fkey" FOREIGN KEY ("driver_type_id") REFERENCES "vehicle_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
