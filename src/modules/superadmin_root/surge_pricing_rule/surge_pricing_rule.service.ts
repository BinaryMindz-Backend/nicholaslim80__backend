import { Injectable } from '@nestjs/common';
import { CreateSurgePricingRuleDto } from './dto/create-surge_pricing_rule.dto';
import { UpdateSurgePricingRuleDto } from './dto/update-surge_pricing_rule.dto';

@Injectable()
export class SurgePricingRuleService {
  create(createSurgePricingRuleDto: CreateSurgePricingRuleDto) {
    return 'This action adds a new surgePricingRule';
  }

  findAll() {
    return `This action returns all surgePricingRule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} surgePricingRule`;
  }

  update(id: number, updateSurgePricingRuleDto: UpdateSurgePricingRuleDto) {
    return `This action updates a #${id} surgePricingRule`;
  }

  remove(id: number) {
    return `This action removes a #${id} surgePricingRule`;
  }
}
