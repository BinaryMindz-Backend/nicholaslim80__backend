-- DropForeignKey
ALTER TABLE "content_management_logs" DROP CONSTRAINT "content_management_logs_contentId_fkey";

-- AddForeignKey
ALTER TABLE "content_management_logs" ADD CONSTRAINT "content_management_logs_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentManagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
