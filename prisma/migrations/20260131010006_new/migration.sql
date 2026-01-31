/*
  Warnings:

  - You are about to drop the column `order_id` on the `AdditionalServices` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AdditionalServices" DROP CONSTRAINT "AdditionalServices_order_id_fkey";

-- AlterTable
ALTER TABLE "AdditionalServices" DROP COLUMN "order_id";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "additional_services" JSONB;
