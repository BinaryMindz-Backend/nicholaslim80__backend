/*
  Warnings:

  - A unique constraint covering the columns `[myRaider_id]` on the table `raiders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "raiders" ADD COLUMN     "myRaider_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "raiders_myRaider_id_key" ON "raiders"("myRaider_id");

-- AddForeignKey
ALTER TABLE "raiders" ADD CONSTRAINT "raiders_myRaider_id_fkey" FOREIGN KEY ("myRaider_id") REFERENCES "my_raiders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
