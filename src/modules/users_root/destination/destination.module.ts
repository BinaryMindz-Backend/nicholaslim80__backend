import { Module } from '@nestjs/common';
import { DestinationService } from './destination.service';
import { DestinationController } from './destination.controller';
import { GeoService } from 'src/utils/geo-location.utils';

@Module({
  controllers: [DestinationController],
  providers: [DestinationService,GeoService],
})
export class DestinationModule {}
