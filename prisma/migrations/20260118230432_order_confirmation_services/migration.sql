-- CreateTable
CREATE TABLE "CustomerOrderConfirmationLog" (
    "id" SERIAL NOT NULL,
    "customerOrderConfirmationId" INTEGER NOT NULL,
    "isNewCustomerWeight" INTEGER NOT NULL,
    "completedOrdersWeight" INTEGER NOT NULL,
    "followersWeight" INTEGER NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerOrderConfirmationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerOrderConfirmationLog_customerOrderConfirmationId_idx" ON "CustomerOrderConfirmationLog"("customerOrderConfirmationId");

-- CreateIndex
CREATE INDEX "CustomerOrderConfirmationLog_createdAt_idx" ON "CustomerOrderConfirmationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "CustomerOrderConfirmationLog" ADD CONSTRAINT "CustomerOrderConfirmationLog_customerOrderConfirmationId_fkey" FOREIGN KEY ("customerOrderConfirmationId") REFERENCES "Customer_order_confirmation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
