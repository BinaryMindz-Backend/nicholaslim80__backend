/*
  Warnings:

  - Changed the type of `applicable_user` on the `UserFeeStructure` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "UserFeeStructure" DROP COLUMN "applicable_user",
ADD COLUMN     "applicable_user" "ApplicableTyp" NOT NULL;
