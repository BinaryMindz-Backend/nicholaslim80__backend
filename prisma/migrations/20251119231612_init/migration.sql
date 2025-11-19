-- AlterTable
ALTER TABLE "destinations" ALTER COLUMN "order_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "order_status" SET DEFAULT 'PROGRESS';
