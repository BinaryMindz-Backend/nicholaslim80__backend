/*
  Warnings:

  - You are about to drop the column `fav_drivers` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[myRaider_id]` on the table `raiders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `myRaider_id` to the `raiders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "raiders" ADD COLUMN     "myRaider_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "fav_drivers";

-- CreateTable
CREATE TABLE "my_raiders" (
    "id" SERIAL NOT NULL,
    "raider_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_fav" BOOLEAN NOT NULL DEFAULT false,
    "find_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "my_raiders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raiders_myRaider_id_key" ON "raiders"("myRaider_id");

-- AddForeignKey
ALTER TABLE "my_raiders" ADD CONSTRAINT "my_raiders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raiders" ADD CONSTRAINT "raiders_myRaider_id_fkey" FOREIGN KEY ("myRaider_id") REFERENCES "my_raiders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
