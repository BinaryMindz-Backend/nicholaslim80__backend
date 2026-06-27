/*
  Warnings:

  - You are about to drop the `disputes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "disputes" DROP CONSTRAINT "disputes_orderId_fkey";

-- AlterTable
ALTER TABLE "DisputeType" ADD COLUMN     "priority" "DisputePriority" NOT NULL DEFAULT 'LOW';

-- DropTable
DROP TABLE "disputes";

-- CreateTable
CREATE TABLE "Dispute" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER,
    "userId" INTEGER,
    "riderId" INTEGER,
    "resolvedByAdminId" INTEGER,
    "disputeTypeId" TEXT NOT NULL,
    "description" TEXT,
    "priority" "DisputePriority" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "evidence" TEXT[],
    "refundType" TEXT,
    "refundAmount" DECIMAL(12,2),
    "companyPercent" INTEGER,
    "riderPercent" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dispute_orderId_idx" ON "Dispute"("orderId");

-- CreateIndex
CREATE INDEX "Dispute_userId_idx" ON "Dispute"("userId");

-- CreateIndex
CREATE INDEX "Dispute_riderId_idx" ON "Dispute"("riderId");

-- CreateIndex
CREATE INDEX "Dispute_disputeTypeId_idx" ON "Dispute"("disputeTypeId");

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_resolvedByAdminId_fkey" FOREIGN KEY ("resolvedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_disputeTypeId_fkey" FOREIGN KEY ("disputeTypeId") REFERENCES "DisputeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
