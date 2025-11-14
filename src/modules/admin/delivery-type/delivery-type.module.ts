import { Module } from '@nestjs/common';
import { DeliveryTypeService } from './delivery-type.service';
import { DeliveryTypeController } from './delivery-type.controller';

@Module({
  controllers: [DeliveryTypeController],
  providers: [DeliveryTypeService],
})
export class DeliveryTypeModule {}
