import { Module } from '@nestjs/common';
import { RidersProfileService } from './riders_profile.service';
import { RidersProfileController } from './riders_profile.controller';
import { QueueModule } from 'src/modules/queue/queue.module';

@Module({
  imports:[
    QueueModule
  ],
  controllers: [RidersProfileController],
  providers: [RidersProfileService],
})
export class RidersProfileModule {}
