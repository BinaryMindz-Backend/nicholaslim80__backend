import { PartialType } from '@nestjs/swagger';
import { CreateMoneyManagementDto } from './create-money-management.dto';

export class UpdateMoneyManagementDto extends PartialType(CreateMoneyManagementDto) {}
