/*
  Warnings:

  - The values [ORDER_UPDATE,PROMOTION,GENERAL] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `updated_at` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('NOTIFICATION', 'PROMOTION');

-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('CREATED', 'EDITED', 'DELETED', 'RESCHEDULED', 'RESENT', 'DISABLED');

-- AlterEnum
ALTER TYPE "NotificationSentRole" ADD VALUE 'ALL';

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('PUSH_NOTIFICATION', 'EMAIL', 'SMS', 'WEB_ANNOUNCEMENT', 'IN_APP');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "category" "NotificationCategory" NOT NULL DEFAULT 'NOTIFICATION',
ADD COLUMN     "expiry_date" TIMESTAMP(3),
ADD COLUMN     "image_url" VARCHAR(500),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "target_user_ids" INTEGER[],
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "title" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "action" "LogAction" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" VARCHAR(255),
    "previous_message" TEXT,
    "new_message" TEXT,
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
