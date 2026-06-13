import { Module } from '@nestjs/common';
import { DisputeAppealController } from './dispute_appeal.controller';
import { DisputeAppealService } from './dispute_appeal.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { ActivityLogService } from 'src/modules/superadmin_root/additional_services/activity_logs.services';
import { DisputeModule } from 'src/modules/superadmin_root/dispute/dispute.module';
import { QueueModule } from 'src/modules/queue/queue.module';


@Module({
  imports: [DisputeModule, QueueModule],
  controllers: [DisputeAppealController],
  providers: [DisputeAppealService, PrismaService, ActivityLogService],
  exports: [DisputeAppealService],
})
export class DisputeAppealModule { }