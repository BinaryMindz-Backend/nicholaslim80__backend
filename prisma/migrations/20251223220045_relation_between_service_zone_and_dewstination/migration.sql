-- AlterTable
ALTER TABLE "destinations" ADD COLUMN     "service_zoneId" INTEGER;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_service_zoneId_fkey" FOREIGN KEY ("service_zoneId") REFERENCES "serviceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
