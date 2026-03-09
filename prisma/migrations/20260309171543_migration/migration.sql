-- DropForeignKey
ALTER TABLE "coin_logs" DROP CONSTRAINT "coin_logs_coinId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_logs" DROP CONSTRAINT "quiz_logs_quizId_fkey";

-- AlterTable
ALTER TABLE "coin_logs" ALTER COLUMN "coinId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "quiz_logs" ALTER COLUMN "quizId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "coin_logs" ADD CONSTRAINT "coin_logs_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "coins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_logs" ADD CONSTRAINT "quiz_logs_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
