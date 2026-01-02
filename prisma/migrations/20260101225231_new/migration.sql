/*
  Warnings:

  - You are about to drop the column `order_id` on the `destinations` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `destinations` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `destinations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `destinations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('PICKUP', 'DROP');

-- CreateEnum
CREATE TYPE "StopStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "destinations" DROP CONSTRAINT "destinations_order_id_fkey";

-- DropForeignKey
ALTER TABLE "destinations" DROP CONSTRAINT "destinations_user_id_fkey";

-- DropIndex
DROP INDEX "orders_userId_idx";

-- AlterTable
ALTER TABLE "destinations" DROP COLUMN "order_id",
DROP COLUMN "user_id",
ADD COLUMN     "additionalInfo" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "useCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "order_stops" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "destinationId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "additionalInfo" TEXT,
    "type" "StopType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "StopStatus" NOT NULL DEFAULT 'PENDING',
    "proofs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop_payments" (
    "id" SERIAL NOT NULL,
    "orderStopId" INTEGER NOT NULL,
    "payType" "PayType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "collectedAt" TIMESTAMP(3),
    "collectedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stop_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_stops_orderId_sequence_idx" ON "order_stops"("orderId", "sequence");

-- CreateIndex
CREATE INDEX "order_stops_orderId_status_idx" ON "order_stops"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stop_payments_orderStopId_key" ON "stop_payments"("orderStopId");

-- CreateIndex
CREATE INDEX "destinations_userId_lastUsedAt_idx" ON "destinations"("userId", "lastUsedAt");

-- CreateIndex
CREATE INDEX "destinations_userId_useCount_idx" ON "destinations"("userId", "useCount");

-- CreateIndex
CREATE INDEX "orders_userId_order_status_idx" ON "orders"("userId", "order_status");

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_stops" ADD CONSTRAINT "order_stops_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_stops" ADD CONSTRAINT "order_stops_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_payments" ADD CONSTRAINT "stop_payments_orderStopId_fkey" FOREIGN KEY ("orderStopId") REFERENCES "order_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
