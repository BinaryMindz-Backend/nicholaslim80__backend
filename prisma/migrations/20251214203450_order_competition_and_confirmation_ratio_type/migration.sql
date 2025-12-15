/*
  Warnings:

  - You are about to drop the column `role` on the `admins` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderConfirmationRatioType" AS ENUM ('GENIUNE', 'MANUAL_CHECK', 'SUSPICIOUS');

-- AlterTable
ALTER TABLE "admins" DROP COLUMN "role";

-- CreateTable
CREATE TABLE "Customer_order_confirmation" (
    "id" SERIAL NOT NULL,
    "is_new_customer_weight" INTEGER NOT NULL DEFAULT 0,
    "completed_orders_weight" INTEGER NOT NULL DEFAULT 0,
    "followers_weight" INTEGER NOT NULL DEFAULT 0,
    "confirmation_ratio_type" "OrderConfirmationRatioType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_order_confirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver_order_competition" (
    "id" SERIAL NOT NULL,
    "rank_weight" INTEGER NOT NULL DEFAULT 0,
    "rating_weight" INTEGER NOT NULL DEFAULT 0,
    "followers_weight" INTEGER NOT NULL DEFAULT 0,
    "total_weights" INTEGER NOT NULL DEFAULT 0,
    "challenges_timeout" INTEGER NOT NULL DEFAULT 0,
    "max_users_to_join" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_order_competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver_order_competition_change_logs" (
    "id" SERIAL NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "followers_weight" INTEGER NOT NULL DEFAULT 0,
    "challenges_timeout" INTEGER NOT NULL DEFAULT 0,
    "max_users_to_join" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "Driver_order_competition_change_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Driver_order_competition_change_logs" ADD CONSTRAINT "Driver_order_competition_change_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
