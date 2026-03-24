import { Module } from '@nestjs/common';
import { PolicyController } from './policy_management.controller';
import { PolicyService } from './policy_management.service';
import { ActivityLogService } from '../additional_services/activity_logs.services';

@Module({
  controllers: [PolicyController],
  providers: [PolicyService, ActivityLogService],
  exports: [PolicyService],
})
export class PolicyManagementModule { }
