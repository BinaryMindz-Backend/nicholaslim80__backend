/*
  Warnings:

  - You are about to drop the column `delivery_type_id` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_type_id` on the `admins` table. All the data in the column will be lost.
  - Added the required column `admin_id` to the `delivery_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_id` to the `vehicle_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `vehicle_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admins" DROP COLUMN "delivery_type_id",
DROP COLUMN "vehicle_type_id";

-- AlterTable
ALTER TABLE "delivery_types" ADD COLUMN     "admin_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "vehicle_types" ADD COLUMN     "admin_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "delivery_types" ADD CONSTRAINT "delivery_types_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_types" ADD CONSTRAINT "vehicle_types_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
