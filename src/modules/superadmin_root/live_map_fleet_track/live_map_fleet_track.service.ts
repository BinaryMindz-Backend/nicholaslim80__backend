import { Injectable } from '@nestjs/common';

// 
@Injectable()
export class LiveMapFleetTrackService {

  findAll() {
    return `This action returns all liveMapFleetTrack`;
  }

  findOne(id: number) {
    return `This action returns a #${id} liveMapFleetTrack`;
  }

  remove(id: number) {
    return `This action removes a #${id} liveMapFleetTrack`;
  }
}
