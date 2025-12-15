/*
  Warnings:

  - You are about to drop the column `confirmation_ratio_type` on the `Customer_order_confirmation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Customer_order_confirmation" DROP COLUMN "confirmation_ratio_type";

-- CreateTable
CREATE TABLE "Customer_order_confirmation_ratio_logs" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER,
    "raider_id" INTEGER,
    "confirmation_ratio_type" "OrderConfirmationRatioType" NOT NULL,
    "is_auto_confirm" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_order_confirmation_ratio_logs_pkey" PRIMARY KEY ("id")
);
