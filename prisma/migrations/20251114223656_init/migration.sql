/*
  Warnings:

  - Added the required column `updated_at` to the `delivery_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "is_seed_admin" SET DEFAULT true;

-- AlterTable
ALTER TABLE "delivery_types" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
