/*
  Warnings:

  - You are about to drop the column `login_id` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `username` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "users_login_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "login_id",
ALTER COLUMN "username" SET NOT NULL,
ALTER COLUMN "username" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
