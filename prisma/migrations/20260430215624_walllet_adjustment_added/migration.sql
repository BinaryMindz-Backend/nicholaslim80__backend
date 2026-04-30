/*
  Warnings:

  - A unique constraint covering the columns `[adjustmentId]` on the table `WalletHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AdjustmentAction" AS ENUM ('ADD_CREDIT_FUNDS', 'DEDUCT_MINUS_FUNDS');

-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('REFUND', 'ADMIN_CORRECTION', 'PENALTY', 'LATE_ARRIVAL', 'SAFETY_VIOLATION', 'CANCELED_TRIP', 'OTHER');

-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('LATE_ARRIVAL', 'SAFETY_VIOLATION', 'CANCELED_TRIP', 'OTHER');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "WalletHistory" ADD COLUMN     "adjustmentId" INTEGER;

-- CreateTable
CREATE TABLE "WalletAdjustment" (
    "id" SERIAL NOT NULL,
    "raiderId" INTEGER,
    "userId" INTEGER,
    "adminId" INTEGER NOT NULL,
    "adjustmentAction" "AdjustmentAction" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "orderId" TEXT,
    "reason" "AdjustmentReason" NOT NULL,
    "penaltyType" "PenaltyType",
    "additionalNotes" TEXT,
    "isConfirmedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isNotify" BOOLEAN NOT NULL DEFAULT true,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletAdjustment_raiderId_idx" ON "WalletAdjustment"("raiderId");

-- CreateIndex
CREATE INDEX "WalletAdjustment_userId_idx" ON "WalletAdjustment"("userId");

-- CreateIndex
CREATE INDEX "WalletAdjustment_adminId_idx" ON "WalletAdjustment"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletHistory_adjustmentId_key" ON "WalletHistory"("adjustmentId");

-- AddForeignKey
ALTER TABLE "WalletHistory" ADD CONSTRAINT "WalletHistory_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "WalletAdjustment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAdjustment" ADD CONSTRAINT "WalletAdjustment_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAdjustment" ADD CONSTRAINT "WalletAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAdjustment" ADD CONSTRAINT "WalletAdjustment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
