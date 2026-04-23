-- AlterTable
ALTER TABLE "order_stops" ADD COLUMN     "is_arrived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_load" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_unload" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proceed_to_pickup" BOOLEAN NOT NULL DEFAULT false;
