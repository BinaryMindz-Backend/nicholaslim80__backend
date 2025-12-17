import { Module } from '@nestjs/common';
import { ServiceZoneService } from './service-zone.service';
import { ServiceZoneController } from './service-zone.controller';

@Module({
  controllers: [ServiceZoneController],
  providers: [ServiceZoneService],
})
export class ServiceZoneModule {}
