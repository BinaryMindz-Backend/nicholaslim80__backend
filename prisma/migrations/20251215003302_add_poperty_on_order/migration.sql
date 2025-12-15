-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "competition_closed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "competition_started_at" TIMESTAMP(3),
ALTER COLUMN "compititor_id" SET DEFAULT ARRAY[]::INTEGER[];
