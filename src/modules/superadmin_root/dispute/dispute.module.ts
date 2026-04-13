import { Module } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
import { QueueModule } from 'src/modules/queue/queue.module';
import { ActivityLogService } from '../additional_services/activity_logs.services';

@Module({
  imports:[
    QueueModule
  ],
  controllers: [DisputeController],
  providers: [DisputeService, ActivityLogService],
  exports: [DisputeService, ActivityLogService],
})
export class DisputeModule {}
