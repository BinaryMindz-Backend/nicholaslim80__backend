import { PartialType } from '@nestjs/swagger';
import { CreateStandardCommissionRateDto } from './create-commission_rate.dto';
import { CreateRaiderCompensationRoleDto } from './create_compensation_role.dto';
import { CreateRaiderDeductionFeeDto } from './create_deduction_fee.dto';
import { CreateUserFeeStructureDto } from './create_ user_fee_structure.dto';

export class UpdateStandardCommissionRateDto extends PartialType(CreateStandardCommissionRateDto) {}
// 
export class UpdateRaiderCompensationRoleDto extends PartialType(CreateRaiderCompensationRoleDto) {}
// 
export class UpdateRaiderDeductionFeeDto extends PartialType(CreateRaiderDeductionFeeDto) {}
// 
export class UpdateUserFeeStructureDto extends PartialType(CreateUserFeeStructureDto) {}


