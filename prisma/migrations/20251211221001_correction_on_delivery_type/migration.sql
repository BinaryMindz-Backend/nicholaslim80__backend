/*
  Warnings:

  - You are about to drop the column `admin_id` on the `delivery_types` table. All the data in the column will be lost.
  - You are about to drop the column `admin_id` on the `vehicle_types` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "delivery_types" DROP CONSTRAINT "delivery_types_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_types" DROP CONSTRAINT "vehicle_types_admin_id_fkey";

-- AlterTable
ALTER TABLE "delivery_types" DROP COLUMN "admin_id";

-- AlterTable
ALTER TABLE "vehicle_types" DROP COLUMN "admin_id";
