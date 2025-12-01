import { Module } from '@nestjs/common';
import { StandardCommissionRateController } from './commission_rate.controller';
import { StandardCommissionRateService } from './commision_rate.services';

@Module({
  controllers: [StandardCommissionRateController],
  providers: [StandardCommissionRateService],
})
export class PlatformFeeModule {}
