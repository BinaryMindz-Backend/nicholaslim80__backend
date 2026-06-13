-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "hasAppeal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "dispute_appeals" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedByAdminId" INTEGER,
ADD COLUMN     "status" "AppealStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "dispute_appeals" ADD CONSTRAINT "dispute_appeals_resolvedByAdminId_fkey" FOREIGN KEY ("resolvedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_appeals" ADD CONSTRAINT "dispute_appeals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
