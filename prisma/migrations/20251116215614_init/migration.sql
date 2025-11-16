/*
  Warnings:

  - The `route_type` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `pick_up_items` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updated_at` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RouteType" AS ENUM ('ONE_WAY', 'ROUND');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivery_type" "DeliveryTypeName" NOT NULL DEFAULT 'EXPRESS',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "route_type",
ADD COLUMN     "route_type" "RouteType" NOT NULL DEFAULT 'ONE_WAY',
DROP COLUMN "pick_up_items",
ADD COLUMN     "pick_up_items" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
