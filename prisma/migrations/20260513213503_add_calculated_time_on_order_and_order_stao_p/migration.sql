-- AlterTable
ALTER TABLE "order_stops" ADD COLUMN     "calculated_time" INTEGER,
ADD COLUMN     "calculated_time_txt" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "total_time" INTEGER;
