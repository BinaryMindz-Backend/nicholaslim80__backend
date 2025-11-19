-- DropForeignKey
ALTER TABLE "destinations" DROP CONSTRAINT "destinations_order_id_fkey";

-- DropForeignKey
ALTER TABLE "destinations" DROP CONSTRAINT "destinations_user_id_fkey";

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
