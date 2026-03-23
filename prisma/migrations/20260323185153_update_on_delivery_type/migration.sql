/*
  Warnings:

  - You are about to drop the column `delivery_duration` on the `delivery_types` table. All the data in the column will be lost.
  - You are about to drop the column `percentage` on the `delivery_types` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_duration` on the `delivery_types` table. All the data in the column will be lost.
  - Added the required column `collection_time` to the `delivery_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `delivery_time` to the `delivery_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_multiplier` to the `delivery_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `delivery_types` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TimeUnit" AS ENUM ('MINUTES', 'HOURS');

-- AlterTable
ALTER TABLE "delivery_types" DROP COLUMN "delivery_duration",
DROP COLUMN "percentage",
DROP COLUMN "pickup_duration",
ADD COLUMN     "allow_stack" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "collection_time" INTEGER NOT NULL,
ADD COLUMN     "collection_unit" "TimeUnit" NOT NULL DEFAULT 'MINUTES',
ADD COLUMN     "delivery_time" INTEGER NOT NULL,
ADD COLUMN     "delivery_unit" "TimeUnit" NOT NULL DEFAULT 'MINUTES',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "price_multiplier" DECIMAL(6,3) NOT NULL,
ADD COLUMN     "priority" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryTypeVehicle" (
    "id" SERIAL NOT NULL,
    "delivery_type_id" INTEGER NOT NULL,
    "vehicle_type_id" INTEGER NOT NULL,

    CONSTRAINT "DeliveryTypeVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_entity_type_entity_id_idx" ON "ActivityLog"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "ActivityLog_user_id_idx" ON "ActivityLog"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryTypeVehicle_delivery_type_id_vehicle_type_id_key" ON "DeliveryTypeVehicle"("delivery_type_id", "vehicle_type_id");

-- AddForeignKey
ALTER TABLE "DeliveryTypeVehicle" ADD CONSTRAINT "DeliveryTypeVehicle_delivery_type_id_fkey" FOREIGN KEY ("delivery_type_id") REFERENCES "delivery_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryTypeVehicle" ADD CONSTRAINT "DeliveryTypeVehicle_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
