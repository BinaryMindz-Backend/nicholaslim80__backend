import { Module } from '@nestjs/common';
import { ServiceZoneService } from './service-zone.service';
import { ServiceZoneController } from './service-zone.controller';
import { ActivityLogService } from '../additional_services/activity_logs.services';

@Module({
  controllers: [ServiceZoneController],
  providers: [ServiceZoneService, ActivityLogService],
  exports: [ServiceZoneService]
})
export class ServiceZoneModule { }
