import { PartialType } from '@nestjs/swagger';
import { CreateStandardCommissionRateDto } from './create-commission_rate.dto';
import { CreateRaiderCompensationRoleDto } from './create_compensation_role.dto';
import { CreateRaiderDeductionFeeDto } from './create_deduction_fee.dto';

export class UpdateStandardCommissionRateDto extends PartialType(CreateStandardCommissionRateDto) {}
// 
export class UpdateRaiderCompensationRoleDto extends PartialType(CreateRaiderCompensationRoleDto) {}
// 
export class UpdateRaiderDeductionFeeDto extends PartialType(CreateRaiderDeductionFeeDto) {}

