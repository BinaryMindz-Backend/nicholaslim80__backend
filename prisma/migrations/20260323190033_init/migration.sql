/*
  Warnings:

  - Changed the type of `name` on the `delivery_types` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "delivery_types" DROP COLUMN "name",
ADD COLUMN     "name" TEXT NOT NULL;
