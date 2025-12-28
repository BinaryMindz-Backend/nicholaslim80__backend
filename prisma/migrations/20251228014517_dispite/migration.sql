/*
  Warnings:

  - You are about to drop the column `case_id` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `evidence_attach` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `isClosed` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `isRefund` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `issue_date` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `service_area_latitude` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `service_area_longitude` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `disputes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `disputes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdById` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdByType` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issueType` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `disputes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'AWAITING_INFO', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DisputeCreatedBy" AS ENUM ('USER', 'RIDER');

-- CreateEnum
CREATE TYPE "DisputeIssueType" AS ENUM ('CUSTOMER_UNREACHABLE', 'WAITING_CHARGE', 'PICKUP_LOCATION_INCORRECT', 'DROPOFF_LOCATION_INCORRECT', 'SAFETY_ACCESS_ISSUE', 'ORDER_NOT_RECEIVED', 'WRONG_ITEM', 'DAMAGED_ITEM', 'PARTIAL_DELIVERY', 'MISDELIVERED', 'PAYMENT_DISPUTE', 'CUSTOMER_BEHAVIOR', 'CHARGED_AFTER_CANCEL');

-- CreateEnum
CREATE TYPE "DisputePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'DISPUTE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'DISPUTE_REFUND';
ALTER TYPE "TransactionType" ADD VALUE 'DISPUTE_COMPENSATION';

-- DropForeignKey
ALTER TABLE "disputes" DROP CONSTRAINT "disputes_case_id_fkey";

-- DropIndex
DROP INDEX "disputes_case_id_idx";

-- DropIndex
DROP INDEX "disputes_case_id_key";

-- AlterTable
ALTER TABLE "disputes" DROP COLUMN "case_id",
DROP COLUMN "category",
DROP COLUMN "evidence_attach",
DROP COLUMN "isClosed",
DROP COLUMN "isRefund",
DROP COLUMN "issue_date",
DROP COLUMN "notes",
DROP COLUMN "service_area_latitude",
DROP COLUMN "service_area_longitude",
DROP COLUMN "total",
DROP COLUMN "username",
ADD COLUMN     "createdById" INTEGER NOT NULL,
ADD COLUMN     "createdByType" "DisputeCreatedBy" NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "orderId" INTEGER,
ADD COLUMN     "refundAmount" DECIMAL(12,2),
ADD COLUMN     "refundType" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedByAdminId" INTEGER,
ADD COLUMN     "riderPercent" INTEGER,
ADD COLUMN     "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "userPercent" INTEGER,
DROP COLUMN "issueType",
ADD COLUMN     "issueType" "DisputeIssueType" NOT NULL,
DROP COLUMN "priority",
ADD COLUMN     "priority" "DisputePriority" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "disputes_orderId_key" ON "disputes"("orderId");

-- CreateIndex
CREATE INDEX "disputes_orderId_idx" ON "disputes"("orderId");

-- CreateIndex
CREATE INDEX "disputes_createdById_idx" ON "disputes"("createdById");

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
