import { Module } from '@nestjs/common';
import { StandardCommissionRateController } from './commission_rate.controller';
import { StandardCommissionRateService } from './commision_rate.services';
import { RaiderCompensationRoleController } from './compensation_role.controller';
import { RaiderCompensationRoleService } from './compensation_role.service';
import { RaiderDeductionFeeController } from './deduction_fee.controller';
import { RaiderDeductionFeeService } from './deduction_fee.service';
import { UserFeeStructureController } from './fee_structure.controller';
import { UserFeeStructureService } from './fee_structure.service';
import { UserDynamicSurgeController } from './dynamic_surge.controller';
import { UserDynamicSurgeService } from './dynamic_surge.services';

@Module({
  controllers: 
  [
     StandardCommissionRateController,
     RaiderCompensationRoleController,
     RaiderDeductionFeeController,
     UserFeeStructureController,
     UserDynamicSurgeController,
  ],
  providers: 
   [
      StandardCommissionRateService,
      RaiderCompensationRoleService,
      RaiderDeductionFeeService ,
      UserFeeStructureService,
      UserDynamicSurgeService
  ],
})
export class PlatformFeeModule {}
