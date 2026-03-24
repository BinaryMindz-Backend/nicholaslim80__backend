/*
  Warnings:

  - You are about to drop the column `delivery_type` on the `orders` table. All the data in the column will be lost.
  - Added the required column `delivery_type_id` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "delivery_type",
ADD COLUMN     "delivery_type_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_type_id_fkey" FOREIGN KEY ("delivery_type_id") REFERENCES "delivery_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
