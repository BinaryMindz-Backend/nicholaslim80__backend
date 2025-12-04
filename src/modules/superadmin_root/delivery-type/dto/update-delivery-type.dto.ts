import { PartialType } from '@nestjs/swagger';
import { CreateDeliveryTypeDto } from './create-delivery-type.dto';

export class UpdateDeliveryTypeDto extends PartialType(CreateDeliveryTypeDto) {}
