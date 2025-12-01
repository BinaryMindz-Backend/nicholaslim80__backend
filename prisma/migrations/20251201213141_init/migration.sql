/*
  Warnings:

  - Added the required column `suspendedDuration` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suspensionReason` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "raider_registrations" ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspendedDuration" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "suspensionReason" TEXT NOT NULL;
