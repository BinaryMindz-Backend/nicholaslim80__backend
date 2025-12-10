import { PartialType } from '@nestjs/swagger';
import { CreateAdvertiseDto } from './create-advertise.dto';

export class UpdateAdvertiseDto extends PartialType(CreateAdvertiseDto) {}
