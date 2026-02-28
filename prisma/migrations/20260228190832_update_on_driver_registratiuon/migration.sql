-- AlterTable
ALTER TABLE "raider_registrations" ALTER COLUMN "current_state_province" DROP NOT NULL,
ALTER COLUMN "current_country" DROP NOT NULL,
ALTER COLUMN "permanent_state_province" DROP NOT NULL,
ALTER COLUMN "permanent_country" DROP NOT NULL;
