-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "incentives" ADD COLUMN     "days_of_month" INTEGER[],
ADD COLUMN     "days_of_week" INTEGER[],
ADD COLUMN     "month_of_year" INTEGER[],
ADD COLUMN     "recurring_type" "RecurringType" NOT NULL DEFAULT 'ONE_TIME',
ADD COLUMN     "week_of_month" INTEGER[];
