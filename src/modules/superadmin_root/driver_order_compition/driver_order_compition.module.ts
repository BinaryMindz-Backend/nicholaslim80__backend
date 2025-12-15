import { Module } from '@nestjs/common';
import { DriverCompetitionController } from './driver_order_compition.controller';
import { DriverCompetitionService } from './driver_order_compition.service';

@Module({
  controllers: [DriverCompetitionController],
  providers: [DriverCompetitionService],
})
export class DriverOrderCompitionModule {}
