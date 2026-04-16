import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SurgePricingRuleService } from './surge_pricing_rule.service';
import { CreateSurgePricingRuleDto } from './dto/create-surge_pricing_rule.dto';
import { UpdateSurgePricingRuleDto } from './dto/update-surge_pricing_rule.dto';

@Controller('surge-pricing-rule')
export class SurgePricingRuleController {
  constructor(private readonly surgePricingRuleService: SurgePricingRuleService) {}

  @Post()
  create(@Body() createSurgePricingRuleDto: CreateSurgePricingRuleDto) {
    return this.surgePricingRuleService.create(createSurgePricingRuleDto);
  }

  @Get()
  findAll() {
    return this.surgePricingRuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.surgePricingRuleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSurgePricingRuleDto: UpdateSurgePricingRuleDto) {
    return this.surgePricingRuleService.update(+id, updateSurgePricingRuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.surgePricingRuleService.remove(+id);
  }
}
