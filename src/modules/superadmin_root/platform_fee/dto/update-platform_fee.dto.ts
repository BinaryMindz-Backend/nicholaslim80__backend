import { PartialType } from '@nestjs/swagger';
import { CreateStandardCommissionRateDto } from './create-commission_rate.dto';

export class UpdateStandardCommissionRateDto extends PartialType(CreateStandardCommissionRateDto) {}
