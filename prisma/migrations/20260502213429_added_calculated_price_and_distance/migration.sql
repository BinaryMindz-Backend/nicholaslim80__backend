-- AlterTable
ALTER TABLE "order_stops" ADD COLUMN     "calculated_distance" DECIMAL(10,4) DEFAULT 0,
ADD COLUMN     "calculated_price" DECIMAL(12,2) DEFAULT 0;
