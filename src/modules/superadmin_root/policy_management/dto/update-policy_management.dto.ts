import { PartialType } from '@nestjs/swagger';
import { CreatePolicyDto } from './create-policy_management.dto';

export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {}
