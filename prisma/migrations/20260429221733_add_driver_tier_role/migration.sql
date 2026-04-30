-- AlterTable
ALTER TABLE "Raider" ADD COLUMN     "tierId" INTEGER;

-- CreateTable
CREATE TABLE "driver_tiers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "priorityScore" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minOrders" INTEGER,
    "minRating" DECIMAL(3,2),
    "maxCancellationRate" DOUBLE PRECISION,
    "requiresBranding" BOOLEAN NOT NULL DEFAULT false,
    "isInvitationOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raider_tier_history" (
    "id" SERIAL NOT NULL,
    "raiderId" INTEGER NOT NULL,
    "driverTierId" INTEGER,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raider_tier_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driver_tiers_name_key" ON "driver_tiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "driver_tiers_code_key" ON "driver_tiers"("code");

-- AddForeignKey
ALTER TABLE "raider_tier_history" ADD CONSTRAINT "raider_tier_history_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_tier_history" ADD CONSTRAINT "raider_tier_history_driverTierId_fkey" FOREIGN KEY ("driverTierId") REFERENCES "driver_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raider" ADD CONSTRAINT "Raider_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "driver_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
