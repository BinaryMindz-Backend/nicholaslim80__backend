/*
  Warnings:

  - You are about to drop the column `addressLink` on the `destinations` table. All the data in the column will be lost.
  - You are about to alter the column `latitude` on the `destinations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,7)` to `DoublePrecision`.
  - You are about to alter the column `longitude` on the `destinations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,7)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "destinations" DROP COLUMN "addressLink",
ADD COLUMN     "addressFromApr" TEXT,
ALTER COLUMN "latitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "longitude" SET DATA TYPE DOUBLE PRECISION;
