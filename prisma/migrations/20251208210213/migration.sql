/*
  Warnings:

  - The `mark_as_read_id` column on the `notifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "mark_as_read_id",
ADD COLUMN     "mark_as_read_id" INTEGER[];
