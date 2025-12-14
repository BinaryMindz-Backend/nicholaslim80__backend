import { Module } from '@nestjs/common';
import { DriverOrderCompitionService } from './driver_order_compition.service';
import { DriverOrderCompitionController } from './driver_order_compition.controller';

@Module({
  controllers: [DriverOrderCompitionController],
  providers: [DriverOrderCompitionService],
})
export class DriverOrderCompitionModule {}
