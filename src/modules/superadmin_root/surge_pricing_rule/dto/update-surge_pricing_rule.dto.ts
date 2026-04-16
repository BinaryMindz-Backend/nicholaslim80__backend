import { PartialType } from '@nestjs/swagger';
import { CreateSurgePricingRuleDto } from './create-surge_pricing_rule.dto';

export class UpdateSurgePricingRuleDto extends PartialType(CreateSurgePricingRuleDto) {}
