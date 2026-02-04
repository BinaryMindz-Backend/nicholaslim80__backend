/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `WalletHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WalletHistory_transactionId_key" ON "WalletHistory"("transactionId");
