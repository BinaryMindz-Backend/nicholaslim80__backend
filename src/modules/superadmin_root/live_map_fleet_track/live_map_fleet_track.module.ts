import { Module } from '@nestjs/common';
import { LiveMapFleetTrackService } from './live_map_fleet_track.service';
import { LiveMapFleetTrackController } from './live_map_fleet_track.controller';

@Module({
  controllers: [LiveMapFleetTrackController],
  providers: [LiveMapFleetTrackService],
})
export class LiveMapFleetTrackModule {}
