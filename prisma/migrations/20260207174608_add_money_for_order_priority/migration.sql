-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "transaction_code" SET DATA TYPE VARCHAR(300);

-- CreateTable
CREATE TABLE "add_money_for_order_priority" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'sgd',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "add_money_for_order_priority_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "add_money_for_order_priority" ADD CONSTRAINT "add_money_for_order_priority_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
