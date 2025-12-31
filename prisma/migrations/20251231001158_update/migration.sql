-- AlterTable
ALTER TABLE "disputes" ADD COLUMN     "evidence" TEXT[],
ADD COLUMN     "is_closed" BOOLEAN NOT NULL DEFAULT false;
