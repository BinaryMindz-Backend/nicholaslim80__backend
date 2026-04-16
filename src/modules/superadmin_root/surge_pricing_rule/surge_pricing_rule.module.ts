import { Module } from '@nestjs/common';
import { SurgePricingRuleService } from './surge_pricing_rule.service';
import { SurgePricingRuleController } from './surge_pricing_rule.controller';

@Module({
  controllers: [SurgePricingRuleController],
  providers: [SurgePricingRuleService],
})
export class SurgePricingRuleModule {}
