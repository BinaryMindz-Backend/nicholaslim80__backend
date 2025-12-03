/*
  Warnings:

  - You are about to drop the column `myRaider_id` on the `raiders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "raiders" DROP CONSTRAINT "raiders_myRaider_id_fkey";

-- DropIndex
DROP INDEX "raiders_myRaider_id_key";

-- AlterTable
ALTER TABLE "my_raiders" ALTER COLUMN "raider_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "raiders" DROP COLUMN "myRaider_id";
