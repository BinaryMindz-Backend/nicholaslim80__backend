import { Module } from '@nestjs/common';
import { DisputeAppealController } from './dispute_appeal.controller';
import { DisputeAppealService } from './dispute_appeal.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { ActivityLogService } from 'src/modules/superadmin_root/additional_services/activity_logs.services';


@Module({
  controllers: [DisputeAppealController],
  providers: [DisputeAppealService, PrismaService, ActivityLogService],
  exports: [DisputeAppealService],
})
export class DisputeAppealModule { }