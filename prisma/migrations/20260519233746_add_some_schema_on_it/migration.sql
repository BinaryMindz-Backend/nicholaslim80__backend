-- AlterTable
ALTER TABLE "Raider" ADD COLUMN     "manualTierId" INTEGER,
ADD COLUMN     "manualTierOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manualTierUntil" TIMESTAMP(3);
