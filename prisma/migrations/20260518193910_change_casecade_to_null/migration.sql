-- DropForeignKey
ALTER TABLE "notification_logs" DROP CONSTRAINT "notification_logs_notificationId_fkey";

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
