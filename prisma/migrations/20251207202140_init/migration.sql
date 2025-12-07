-- CreateEnum
CREATE TYPE "NotificationSentRole" AS ENUM ('USER', 'RAIDER');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SMS';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "target_role" "NotificationSentRole";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "fcmToken" TEXT;
