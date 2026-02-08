import { Module } from '@nestjs/common';
import { AdvertiseService } from './advertise.service';
import { AdvertiseController } from './advertise.controller';
import { QueueModule } from 'src/modules/queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [AdvertiseController],
  providers: [AdvertiseService],
  exports: [AdvertiseService]
})
export class AdvertiseModule { }
