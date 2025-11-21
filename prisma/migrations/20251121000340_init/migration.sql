-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('COD', 'WALLET', 'ONLINE_PAY');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "pay_type" "PayType" NOT NULL DEFAULT 'WALLET';
