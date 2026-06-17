-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by" TEXT;
