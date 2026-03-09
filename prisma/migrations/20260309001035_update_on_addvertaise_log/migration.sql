-- DropForeignKey
ALTER TABLE "advertise_logs" DROP CONSTRAINT "advertise_logs_advertiseId_fkey";

-- AlterTable
ALTER TABLE "advertise_logs" ALTER COLUMN "advertiseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "advertise_logs" ADD CONSTRAINT "advertise_logs_advertiseId_fkey" FOREIGN KEY ("advertiseId") REFERENCES "Advertise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
