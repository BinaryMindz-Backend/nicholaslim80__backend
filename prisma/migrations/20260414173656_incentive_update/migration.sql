/*
  Warnings:

  - You are about to drop the column `days_of_month` on the `incentives` table. All the data in the column will be lost.
  - You are about to drop the column `month_of_year` on the `incentives` table. All the data in the column will be lost.
  - The `days_of_week` column on the `incentives` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('ALL', 'MON', 'TUE', 'WED', 'THURS', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "MonthName" AS ENUM ('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');

-- AlterTable
ALTER TABLE "incentives" DROP COLUMN "days_of_month",
DROP COLUMN "month_of_year",
ADD COLUMN     "day_of_month" INTEGER[],
ADD COLUMN     "month" "MonthName",
ALTER COLUMN "end_date" DROP NOT NULL,
DROP COLUMN "days_of_week",
ADD COLUMN     "days_of_week" "DayOfWeek"[];
