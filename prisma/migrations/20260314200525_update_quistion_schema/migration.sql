/*
  Warnings:

  - Changed the type of `quesCategory` on the `questions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "quesCategory",
ADD COLUMN     "quesCategory" TEXT NOT NULL;
