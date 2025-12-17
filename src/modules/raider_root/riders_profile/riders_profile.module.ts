import { Module } from '@nestjs/common';
import { RidersProfileService } from './riders_profile.service';
import { RidersProfileController } from './riders_profile.controller';

@Module({
  controllers: [RidersProfileController],
  providers: [RidersProfileService],
})
export class RidersProfileModule {}
