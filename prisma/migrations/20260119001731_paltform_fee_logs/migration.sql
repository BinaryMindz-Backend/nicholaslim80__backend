-- CreateEnum
CREATE TYPE "FeeLogType" AS ENUM ('STANDARD_COMMISSION_RATE', 'RAIDER_COMPENSATION_ROLE', 'RAIDER_DEDUCTION_FEE', 'USER_FEE_STRUCTURE', 'USER_DYNAMIC_SURGE');

-- CreateTable
CREATE TABLE "fee_configuration_logs" (
    "id" SERIAL NOT NULL,
    "log_type" "FeeLogType" NOT NULL,
    "reference_id" INTEGER NOT NULL,
    "applicable_user" "ApplicableTyp" NOT NULL,
    "service_area" VARCHAR(100),
    "snapshot" JSONB NOT NULL,
    "changed_by_role" TEXT NOT NULL,
    "changed_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_configuration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_configuration_logs_log_type_idx" ON "fee_configuration_logs"("log_type");

-- CreateIndex
CREATE INDEX "fee_configuration_logs_reference_id_idx" ON "fee_configuration_logs"("reference_id");

-- CreateIndex
CREATE INDEX "fee_configuration_logs_created_at_idx" ON "fee_configuration_logs"("created_at");
