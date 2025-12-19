/*
  Warnings:

  - You are about to drop the column `TransactionType` on the `WalletHistory` table. All the data in the column will be lost.
  - Added the required column `transactionType` to the `WalletHistory` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `WalletHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('PAYOUT', 'PAYMENT', 'REFUND', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "WalletHistory" DROP COLUMN "TransactionType",
ADD COLUMN     "transactionType" "WalletTransactionType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "WalletTransactionStatus" NOT NULL;
