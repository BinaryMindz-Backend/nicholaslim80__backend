import { Module } from '@nestjs/common';
import { StandardCommissionRateController } from './commission_rate.controller';
import { StandardCommissionRateService } from './commision_rate.services';
import { RaiderCompensationRoleController } from './compensation_role.controller';
import { RaiderCompensationRoleService } from './compensation_role.service';
import { RaiderDeductionFeeController } from './deduction_fee.controller';
import { RaiderDeductionFeeService } from './deduction_fee.service';

@Module({
  controllers: [StandardCommissionRateController, RaiderCompensationRoleController, RaiderDeductionFeeController],
  providers: [StandardCommissionRateService, RaiderCompensationRoleService, RaiderDeductionFeeService],
})
export class PlatformFeeModule {}
