/*
  Warnings:

  - Added the required column `quesCategory` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quesDeficulty` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quesType` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuesType" AS ENUM ('MULTIPLE', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "QuesDeficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuesCategory" AS ENUM ('SAFETY_PROCUDURE', 'GENERAL', 'IQ');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "quesCategory" "QuesCategory" NOT NULL,
ADD COLUMN     "quesDeficulty" "QuesDeficulty" NOT NULL,
ADD COLUMN     "quesType" "QuesType" NOT NULL;
