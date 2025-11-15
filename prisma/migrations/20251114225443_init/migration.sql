/*
  Warnings:

  - You are about to drop the column `delivery_time` on the `delivery_types` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_time` on the `delivery_types` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "delivery_types" DROP COLUMN "delivery_time",
DROP COLUMN "pickup_time",
ADD COLUMN     "delivery_duration" INTEGER,
ADD COLUMN     "pickup_duration" INTEGER;
