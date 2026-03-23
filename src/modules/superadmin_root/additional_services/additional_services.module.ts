import { Module } from '@nestjs/common';
import { AdditionalServicesService } from './additional_services.service';
import { AdditionalServicesController } from './additional_services.controller';
import { ActivityLogService } from './activity_logs.services';

@Module({
  controllers: [AdditionalServicesController,],
  providers: [AdditionalServicesService, ActivityLogService],
})
export class AdditionalServicesModule { }
