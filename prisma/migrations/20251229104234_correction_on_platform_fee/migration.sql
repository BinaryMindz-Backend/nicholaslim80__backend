/*
  Warnings:

  - The values [ORDERLESS15] on the enum `FeeAppliesType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FeeAppliesType_new" AS ENUM ('ALL_ORDERS', 'ORDER_LESS', 'EXPRESS_ORDERS', 'SCHEDULED_ORDERS', 'STACKED_ORDERS');
ALTER TABLE "UserFeeStructure" ALTER COLUMN "applies_to" TYPE "FeeAppliesType_new" USING ("applies_to"::text::"FeeAppliesType_new");
ALTER TYPE "FeeAppliesType" RENAME TO "FeeAppliesType_old";
ALTER TYPE "FeeAppliesType_new" RENAME TO "FeeAppliesType";
DROP TYPE "public"."FeeAppliesType_old";
COMMIT;

-- AlterTable
ALTER TABLE "UserFeeStructure" ADD COLUMN     "condition_unit" VARCHAR(20),
ADD COLUMN     "condition_value" DOUBLE PRECISION,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
