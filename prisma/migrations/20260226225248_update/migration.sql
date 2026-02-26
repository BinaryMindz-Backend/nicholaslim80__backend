-- DropForeignKey
ALTER TABLE "incentive_logs" DROP CONSTRAINT "incentive_logs_incentiveId_fkey";

-- AlterTable
ALTER TABLE "incentive_logs" ALTER COLUMN "incentiveId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "incentive_logs" ADD CONSTRAINT "incentive_logs_incentiveId_fkey" FOREIGN KEY ("incentiveId") REFERENCES "incentives"("id") ON DELETE SET NULL ON UPDATE CASCADE;
