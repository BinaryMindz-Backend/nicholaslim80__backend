import { PartialType } from '@nestjs/swagger';
import { CreateStandardCommissionRateDto } from './create-commission_rate.dto';
import { CreateRaiderCompensationRoleDto } from './create_compensation_role.dto';

export class UpdateStandardCommissionRateDto extends PartialType(CreateStandardCommissionRateDto) {}
// 
export class UpdateRaiderCompensationRoleDto extends PartialType(CreateRaiderCompensationRoleDto) {}
