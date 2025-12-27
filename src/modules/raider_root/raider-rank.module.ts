import { Module } from '@nestjs/common';
import { RaiderRankService } from './raider-rank.service';

@Module({
  providers: [RaiderRankService],
  exports: [RaiderRankService],
})
export class RaiderRankModule {}
