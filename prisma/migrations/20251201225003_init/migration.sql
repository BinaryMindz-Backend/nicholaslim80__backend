/*
  Warnings:

  - You are about to alter the column `score` on the `raider_quizzes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `Integer`.
  - Made the column `score` on table `raider_quizzes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "raider_quizzes" ADD COLUMN     "attempt_count" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "total_questions" SET DEFAULT 0,
ALTER COLUMN "correct_answers" SET DEFAULT 0,
ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "score" SET DEFAULT 0,
ALTER COLUMN "score" SET DATA TYPE INTEGER;
