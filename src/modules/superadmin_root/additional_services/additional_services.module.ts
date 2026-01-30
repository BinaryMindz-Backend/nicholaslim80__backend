import { Module } from '@nestjs/common';
import { AdditionalServicesService } from './additional_services.service';
import { AdditionalServicesController } from './additional_services.controller';

@Module({
  controllers: [AdditionalServicesController],
  providers: [AdditionalServicesService],
})
export class AdditionalServicesModule {}
