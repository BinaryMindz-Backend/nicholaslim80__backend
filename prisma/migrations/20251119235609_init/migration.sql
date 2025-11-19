-- DropIndex
DROP INDEX "orders_payment_method_id_key";

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "payment_method_id" DROP NOT NULL;
