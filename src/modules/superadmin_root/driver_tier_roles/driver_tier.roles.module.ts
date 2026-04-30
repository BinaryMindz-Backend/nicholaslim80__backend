import { Module } from '@nestjs/common';
import { DriverTierController } from './driver_tier.roles.controller';
import { DriverTierService } from './driver_tier.roles.services';

@Module({
  controllers: [DriverTierController],
  providers: [DriverTierService],
})
export class DriverTierModule { }
