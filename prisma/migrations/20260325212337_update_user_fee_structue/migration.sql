/*
  Warnings:

  - You are about to drop the column `condition_unit` on the `UserFeeStructure` table. All the data in the column will be lost.
  - Changed the type of `applicable_user` on the `UserFeeStructure` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `applies_to` on the `UserFeeStructure` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "UserFeeStructure" DROP COLUMN "condition_unit",
ADD COLUMN     "rule_key" TEXT,
ADD COLUMN     "rule_operator" TEXT,
ADD COLUMN     "rule_value" TEXT,
DROP COLUMN "applicable_user",
ADD COLUMN     "applicable_user" TEXT NOT NULL,
DROP COLUMN "applies_to",
ADD COLUMN     "applies_to" TEXT NOT NULL;

-- DropEnum
DROP TYPE "FeeAppliesType";
