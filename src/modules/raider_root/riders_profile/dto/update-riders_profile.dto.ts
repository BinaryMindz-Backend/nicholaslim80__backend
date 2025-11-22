import { PartialType } from '@nestjs/swagger';
import { CreateRidersProfileDto } from './create-riders_profile.dto';

export class UpdateRidersProfileDto extends PartialType(CreateRidersProfileDto) {}
