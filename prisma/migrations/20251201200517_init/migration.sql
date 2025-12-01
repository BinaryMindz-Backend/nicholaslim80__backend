/*
  Warnings:

  - Added the required column `signInPortal` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PortalEnum" AS ENUM ('WEB_PORTAL', 'APP_PORTAL');

-- AlterTable
ALTER TABLE "raider_registrations" ADD COLUMN     "signInPortal" "PortalEnum" NOT NULL;
