/*
  Warnings:

  - Changed the type of `log_type` on the `fee_configuration_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "fee_configuration_logs" DROP COLUMN "log_type",
ADD COLUMN     "log_type" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "fee_configuration_logs_log_type_idx" ON "fee_configuration_logs"("log_type");
