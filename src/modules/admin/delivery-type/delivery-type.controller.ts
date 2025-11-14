import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DeliveryTypeService } from './delivery-type.service';
import { CreateDeliveryTypeDto } from './dto/create-delivery-type.dto';
import { UpdateDeliveryTypeDto } from './dto/update-delivery-type.dto';

@Controller('delivery-type')
export class DeliveryTypeController {
  constructor(private readonly deliveryTypeService: DeliveryTypeService) {}

  @Post()
  create(@Body() createDeliveryTypeDto: CreateDeliveryTypeDto) {
    return this.deliveryTypeService.create(createDeliveryTypeDto);
  }

  @Get()
  findAll() {
    return this.deliveryTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveryTypeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeliveryTypeDto: UpdateDeliveryTypeDto) {
    return this.deliveryTypeService.update(+id, updateDeliveryTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deliveryTypeService.remove(+id);
  }
}
