import { PartialType } from '@nestjs/swagger';
import { CreateDriverCompetitionDto } from './create-driver_order_compition.dto';

export class UpdateDriverOrderCompitionDto extends PartialType(CreateDriverCompetitionDto) {}
