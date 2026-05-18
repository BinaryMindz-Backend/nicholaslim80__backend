-- AlterTable
ALTER TABLE "notification_logs" ALTER COLUMN "notificationId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "notification_logs_notificationId_idx" ON "notification_logs"("notificationId");

-- CreateIndex
CREATE INDEX "notification_logs_adminId_idx" ON "notification_logs"("adminId");
