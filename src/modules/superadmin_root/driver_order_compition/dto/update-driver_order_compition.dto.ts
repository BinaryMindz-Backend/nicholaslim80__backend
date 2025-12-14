import { PartialType } from '@nestjs/swagger';
import { CreateDriverOrderCompitionDto } from './create-driver_order_compition.dto';

export class UpdateDriverOrderCompitionDto extends PartialType(CreateDriverOrderCompitionDto) {}
