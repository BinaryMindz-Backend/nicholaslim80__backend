import { PartialType } from '@nestjs/swagger';
import { CreateIncentiveDto } from './create-incentive.dto';

export class UpdateIncentiveDto extends PartialType(CreateIncentiveDto) {}
