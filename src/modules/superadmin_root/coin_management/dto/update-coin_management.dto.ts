import { PartialType } from '@nestjs/swagger';
import { CreateCoinManagementDto } from './create-coin_management.dto';

export class UpdateCoinManagementDto extends PartialType(CreateCoinManagementDto) {}
