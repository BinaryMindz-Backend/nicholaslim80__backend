/*
  Warnings:

  - You are about to drop the column `refer_link` on the `refers` table. All the data in the column will be lost.
  - You are about to drop the column `referred_by_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_referred_by_id_fkey";

-- AlterTable
ALTER TABLE "refers" DROP COLUMN "refer_link",
ALTER COLUMN "how_its_work" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "referred_by_id";
