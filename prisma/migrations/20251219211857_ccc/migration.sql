/*
  Warnings:

  - You are about to drop the column `transaction_id` on the `payment_methods` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "payment_methods" DROP CONSTRAINT "payment_methods_transaction_id_fkey";

-- DropIndex
DROP INDEX "payment_methods_transaction_id_key";

-- AlterTable
ALTER TABLE "payment_methods" DROP COLUMN "transaction_id";

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "payment_method_id" INTEGER;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
