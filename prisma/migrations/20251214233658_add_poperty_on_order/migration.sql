/*
  Warnings:

  - The values [SCHEDULED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "CollectTime" AS ENUM ('ASAP', 'SCHEDULED');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('COMPLETED', 'CANCELLED', 'PENDING', 'PROGRESS', 'ONGOING', 'FAILED');
ALTER TABLE "public"."orders" ALTER COLUMN "order_status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "order_status" TYPE "OrderStatus_new" USING ("order_status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "order_status" SET DEFAULT 'PROGRESS';
COMMIT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "collect_time" "CollectTime" NOT NULL DEFAULT 'ASAP';
