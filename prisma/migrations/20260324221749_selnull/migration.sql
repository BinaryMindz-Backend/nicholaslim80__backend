-- DropForeignKey
ALTER TABLE "DeliveryTypeVehicle" DROP CONSTRAINT "DeliveryTypeVehicle_delivery_type_id_fkey";

-- AddForeignKey
ALTER TABLE "DeliveryTypeVehicle" ADD CONSTRAINT "DeliveryTypeVehicle_delivery_type_id_fkey" FOREIGN KEY ("delivery_type_id") REFERENCES "delivery_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
