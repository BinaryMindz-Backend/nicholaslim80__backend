/*
  Warnings:

  - You are about to drop the column `card_name` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `card_number` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `cvv` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `expiry_date` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method_id` on the `transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transaction_id]` on the table `payment_methods` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expMonth` to the `payment_methods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expYear` to the `payment_methods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last4` to the `payment_methods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeMethodId` to the `payment_methods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_id` to the `payment_methods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `payment_methods` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payment_methods" DROP CONSTRAINT "payment_methods_userId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_payment_method_id_fkey";

-- AlterTable
ALTER TABLE "payment_methods" DROP COLUMN "card_name",
DROP COLUMN "card_number",
DROP COLUMN "cvv",
DROP COLUMN "expiry_date",
ADD COLUMN     "expMonth" INTEGER NOT NULL,
ADD COLUMN     "expYear" INTEGER NOT NULL,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last4" TEXT NOT NULL,
ADD COLUMN     "stripeMethodId" TEXT NOT NULL,
ADD COLUMN     "transaction_id" INTEGER NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "payment_method_id";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentWalletBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "totalWalletBalance" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WalletHistory" (
    "id" SERIAL NOT NULL,
    "transactionId" TEXT NOT NULL,
    "TransactionType" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_transaction_id_key" ON "payment_methods"("transaction_id");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletHistory" ADD CONSTRAINT "WalletHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
