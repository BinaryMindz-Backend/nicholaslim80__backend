-- AlterTable
ALTER TABLE "order_stops" ADD COLUMN     "arrivedStepAt" TIMESTAMP(3),
ADD COLUMN     "loadedAt" TIMESTAMP(3),
ADD COLUMN     "proceedAt" TIMESTAMP(3),
ADD COLUMN     "unloadedAt" TIMESTAMP(3);
