-- CreateTable
CREATE TABLE "dispute_appeals" (
    "id" SERIAL NOT NULL,
    "orderDisputeId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispute_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dispute_appeals_orderDisputeId_idx" ON "dispute_appeals"("orderDisputeId");

-- CreateIndex
CREATE INDEX "dispute_appeals_orderId_idx" ON "dispute_appeals"("orderId");

-- AddForeignKey
ALTER TABLE "dispute_appeals" ADD CONSTRAINT "dispute_appeals_orderDisputeId_fkey" FOREIGN KEY ("orderDisputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_appeals" ADD CONSTRAINT "dispute_appeals_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
