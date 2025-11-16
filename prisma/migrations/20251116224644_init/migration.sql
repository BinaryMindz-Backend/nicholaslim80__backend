/*
  Warnings:

  - Added the required column `user_id` to the `destinations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "destinations" ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "type" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
