import { PartialType } from '@nestjs/swagger';
import { CreateMyRaiderDto } from './create-my_raider.dto';

export class UpdateMyRaiderDto extends PartialType(CreateMyRaiderDto) {}
