import { PartialType } from '@nestjs/swagger';
import { CreateServiceZoneDto } from './create-service-zone.dto';

export class UpdateServiceZoneDto extends PartialType(CreateServiceZoneDto) {}
