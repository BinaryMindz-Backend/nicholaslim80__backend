/*
  Warnings:

  - You are about to drop the `my_raiders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "my_raiders" DROP CONSTRAINT "my_raiders_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripe_customer_id" VARCHAR(100),
ADD COLUMN     "stripe_payment_method_id" VARCHAR(100);

-- DropTable
DROP TABLE "my_raiders";
