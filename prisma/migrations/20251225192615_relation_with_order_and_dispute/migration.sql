/*
  Warnings:

  - A unique constraint covering the columns `[case_id]` on the table `disputes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "disputes_case_id_key" ON "disputes"("case_id");

-- CreateIndex
CREATE INDEX "disputes_case_id_idx" ON "disputes"("case_id");

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
