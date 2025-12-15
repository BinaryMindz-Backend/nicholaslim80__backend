import { Module } from '@nestjs/common';
import { PolicyController } from './policy_management.controller';
import { PolicyService } from './policy_management.service';

@Module({
  controllers: [PolicyController],
  providers: [PolicyService],
})
export class PolicyManagementModule {}
