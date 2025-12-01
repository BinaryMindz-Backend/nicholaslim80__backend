import { Module } from '@nestjs/common';
import { StandardCommissionRateController } from './commission_rate.controller';
import { StandardCommissionRateService } from './commision_rate.services';
import { RaiderCompensationRoleController } from './compensation_role.controller';
import { RaiderCompensationRoleService } from './compensation_role.service';

@Module({
  controllers: [StandardCommissionRateController, RaiderCompensationRoleController],
  providers: [StandardCommissionRateService, RaiderCompensationRoleService],
})
export class PlatformFeeModule {}
