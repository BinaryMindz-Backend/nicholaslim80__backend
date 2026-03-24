import { Module } from '@nestjs/common';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { ActivityLogService } from 'src/modules/superadmin_root/additional_services/activity_logs.services';


@Module({
  controllers: [RbacController],
  providers: [RbacService, ActivityLogService],
  exports: [RbacService, ActivityLogService]
})
export class RbacModule { }