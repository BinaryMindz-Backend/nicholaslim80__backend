-- DropForeignKey
ALTER TABLE "refers" DROP CONSTRAINT "refers_user_id_fkey";

-- AddForeignKey
ALTER TABLE "refers" ADD CONSTRAINT "refers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
