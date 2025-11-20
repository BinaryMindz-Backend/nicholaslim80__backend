-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_acc_refered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refer_code" VARCHAR(100);
