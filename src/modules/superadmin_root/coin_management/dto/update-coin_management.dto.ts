import { PartialType } from '@nestjs/swagger';
import { CreateCoinDto } from './create-coin_management.dto';

export class UpdateCoinManagementDto extends PartialType(CreateCoinDto) {}
