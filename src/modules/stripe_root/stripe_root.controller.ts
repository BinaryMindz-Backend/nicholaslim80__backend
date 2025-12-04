import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StripeRootService } from './stripe_root.service';
import { CreateStripeRootDto } from './dto/create-stripe_root.dto';
import { UpdateStripeRootDto } from './dto/update-stripe_root.dto';

@Controller('stripe-root')
export class StripeRootController {
  constructor(private readonly stripeRootService: StripeRootService) {}

  @Post()
  create(@Body() createStripeRootDto: CreateStripeRootDto) {
    return this.stripeRootService.create(createStripeRootDto);
  }

  @Get()
  findAll() {
    return this.stripeRootService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stripeRootService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStripeRootDto: UpdateStripeRootDto) {
    return this.stripeRootService.update(+id, updateStripeRootDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stripeRootService.remove(+id);
  }
}
