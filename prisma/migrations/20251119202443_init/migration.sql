/*
  Warnings:

  - You are about to drop the column `destination_id` on the `orders` table. All the data in the column will be lost.
  - The `pick_up_items` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `order_id` to the `destinations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_destination_id_fkey";

-- AlterTable
ALTER TABLE "destinations" ADD COLUMN     "order_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "destination_id",
DROP COLUMN "pick_up_items",
ADD COLUMN     "pick_up_items" TEXT[];

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
