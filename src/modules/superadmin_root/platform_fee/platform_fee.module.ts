import { Module } from '@nestjs/common';
import { PlatformFeeService } from './platform_fee.service';
import { PlatformFeeController } from './platform_fee.controller';

@Module({
  controllers: [PlatformFeeController],
  providers: [PlatformFeeService],
})
export class PlatformFeeModule {}
