import { Module } from '@nestjs/common';
import { ReferloyalityService } from './referloyality.service';
import { ReferloyalityController } from './referloyality.controller';

@Module({
  controllers: [ReferloyalityController],
  providers: [ReferloyalityService],
})
export class ReferloyalityModule {}
