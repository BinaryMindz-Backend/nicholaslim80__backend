/*
  Warnings:

  - You are about to drop the column `activityBoost` on the `Raider` table. All the data in the column will be lost.
  - You are about to drop the column `rank` on the `Raider` table. All the data in the column will be lost.
  - You are about to drop the column `rankScore` on the `Raider` table. All the data in the column will be lost.
  - Made the column `reviews_count` on table `Raider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `completed_orders` on table `Raider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active_days` on table `Raider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cancellation_rate` on table `Raider` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Raider" DROP COLUMN "activityBoost",
DROP COLUMN "rank",
DROP COLUMN "rankScore",
ADD COLUMN     "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN     "completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "isGoldOptedIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastOrderAssignedAt" TIMESTAMP(3),
ADD COLUMN     "weeklyActiveHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "reviews_count" SET NOT NULL,
ALTER COLUMN "completed_orders" SET NOT NULL,
ALTER COLUMN "active_days" SET NOT NULL,
ALTER COLUMN "cancellation_rate" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "lastDeliveryAt" DROP NOT NULL,
ALTER COLUMN "lastDeliveryAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "driver_tiers" ADD COLUMN     "minCompletionRate" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "driver_tiers_priorityScore_idx" ON "driver_tiers"("priorityScore");
