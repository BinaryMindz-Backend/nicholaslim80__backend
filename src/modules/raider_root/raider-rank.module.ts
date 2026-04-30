import { Module } from '@nestjs/common';
import { RaiderTierService } from './raider-rank.service';

@Module({
  providers: [RaiderTierService],
  exports: [RaiderTierService],
})
export class RaiderRankModule {}
