import { PartialType } from '@nestjs/swagger';
import { CreateRiderRegistrationDto } from './create-riders_profile.dto';

export class UpdateRidersProfileDto extends PartialType(CreateRiderRegistrationDto) { }
