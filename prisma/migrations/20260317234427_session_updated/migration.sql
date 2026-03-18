-- AlterTable
ALTER TABLE "UserLogin" ADD COLUMN     "durationInMinutes" INTEGER,
ADD COLUMN     "logoutAt" TIMESTAMP(3);
