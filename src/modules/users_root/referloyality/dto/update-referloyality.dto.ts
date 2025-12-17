import { PartialType } from '@nestjs/swagger';
import { CreateReferloyalityDto } from './create-referloyality.dto';

export class UpdateReferloyalityDto extends PartialType(CreateReferloyalityDto) {}
