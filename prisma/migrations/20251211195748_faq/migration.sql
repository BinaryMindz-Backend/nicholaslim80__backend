/*
  Warnings:

  - You are about to drop the `raiders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_assign_rider_id_fkey";

-- DropForeignKey
ALTER TABLE "raider_location_history" DROP CONSTRAINT "raider_location_history_raiderId_fkey";

-- DropForeignKey
ALTER TABLE "raider_locations" DROP CONSTRAINT "raider_locations_raiderId_fkey";

-- DropForeignKey
ALTER TABLE "raider_quizzes" DROP CONSTRAINT "raider_quizzes_raiderId_fkey";

-- DropForeignKey
ALTER TABLE "raider_registrations" DROP CONSTRAINT "raider_registrations_raiderId_fkey";

-- DropForeignKey
ALTER TABLE "raiders" DROP CONSTRAINT "raiders_userId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_raiderId_fkey";

-- DropForeignKey
ALTER TABLE "tips" DROP CONSTRAINT "tips_raiderId_fkey";

-- DropTable
DROP TABLE "raiders";

-- CreateTable
CREATE TABLE "FAQ" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Raider" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "raider_status" "RaiderStatus" NOT NULL DEFAULT 'IN_ACTIVE',
    "LoginType" "LoginType" NOT NULL DEFAULT 'DIRECT_SIGNIN',
    "raider_verificationFromAdmin" "RaiderVerification" NOT NULL DEFAULT 'PENDING',
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedDuration" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Raider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Raider_userId_key" ON "Raider"("userId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assign_rider_id_fkey" FOREIGN KEY ("assign_rider_id") REFERENCES "Raider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raider" ADD CONSTRAINT "Raider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_locations" ADD CONSTRAINT "raider_locations_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_location_history" ADD CONSTRAINT "raider_location_history_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_quizzes" ADD CONSTRAINT "raider_quizzes_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_registrations" ADD CONSTRAINT "raider_registrations_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
