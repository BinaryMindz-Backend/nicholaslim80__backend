import { PartialType } from '@nestjs/swagger';
import { CreateStripeRootDto } from './create-stripe_root.dto';

export class UpdateStripeRootDto extends PartialType(CreateStripeRootDto) {}
