/*
  Warnings:

  - You are about to drop the column `receiver_accuracy` on the `destinations` table. All the data in the column will be lost.
  - You are about to drop the column `receiver_latitude` on the `destinations` table. All the data in the column will be lost.
  - You are about to drop the column `receiver_longitude` on the `destinations` table. All the data in the column will be lost.
  - You are about to drop the column `sender_accuracy` on the `destinations` table. All the data in the column will be lost.
  - You are about to drop the column `sender_latitude` on the `destinations` table. All the data in the column will be lost.
  - You are about to drop the column `sender_longitude` on the `destinations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "destinations" DROP COLUMN "receiver_accuracy",
DROP COLUMN "receiver_latitude",
DROP COLUMN "receiver_longitude",
DROP COLUMN "sender_accuracy",
DROP COLUMN "sender_latitude",
DROP COLUMN "sender_longitude",
ADD COLUMN     "accuracy" DOUBLE PRECISION,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7);
