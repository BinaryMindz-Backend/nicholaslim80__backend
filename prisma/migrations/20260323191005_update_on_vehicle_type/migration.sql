/*
  Warnings:

  - You are about to drop the column `dimension` on the `vehicle_types` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vehicle_types" DROP COLUMN "dimension",
ADD COLUMN     "base_distance" DECIMAL(12,2),
ADD COLUMN     "dimension_height" DECIMAL(12,2),
ADD COLUMN     "dimension_length" DECIMAL(12,2),
ADD COLUMN     "dimension_width" DECIMAL(12,2);
