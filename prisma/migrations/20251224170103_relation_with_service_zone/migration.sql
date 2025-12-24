-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "serviceZoneId" INTEGER;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_serviceZoneId_fkey" FOREIGN KEY ("serviceZoneId") REFERENCES "serviceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
