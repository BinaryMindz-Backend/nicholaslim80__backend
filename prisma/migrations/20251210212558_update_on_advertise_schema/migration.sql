/*
  Warnings:

  - Changed the type of `create_for` on the `Advertise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Advertise" DROP COLUMN "create_for",
ADD COLUMN     "create_for" TEXT NOT NULL;
