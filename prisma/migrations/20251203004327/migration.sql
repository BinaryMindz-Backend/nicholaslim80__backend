/*
  Warnings:

  - You are about to drop the column `raider_id` on the `my_raiders` table. All the data in the column will be lost.
  - You are about to drop the column `myRaider_id` on the `raiders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[raiderId]` on the table `raider_registrations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "raiders" DROP CONSTRAINT "raiders_myRaider_id_fkey";

-- DropIndex
DROP INDEX "raiders_myRaider_id_key";

-- AlterTable
ALTER TABLE "my_raiders" DROP COLUMN "raider_id";

-- AlterTable
ALTER TABLE "raiders" DROP COLUMN "myRaider_id";

-- CreateIndex
CREATE UNIQUE INDEX "raider_registrations_raiderId_key" ON "raider_registrations"("raiderId");
