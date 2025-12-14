import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DriverOrderCompitionService } from './driver_order_compition.service';
import { CreateDriverOrderCompitionDto } from './dto/create-driver_order_compition.dto';
import { UpdateDriverOrderCompitionDto } from './dto/update-driver_order_compition.dto';

@Controller('driver-order-compition')
export class DriverOrderCompitionController {
  constructor(private readonly driverOrderCompitionService: DriverOrderCompitionService) {}

  @Post()
  create(@Body() createDriverOrderCompitionDto: CreateDriverOrderCompitionDto) {
    return this.driverOrderCompitionService.create(createDriverOrderCompitionDto);
  }

  @Get()
  findAll() {
    return this.driverOrderCompitionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverOrderCompitionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDriverOrderCompitionDto: UpdateDriverOrderCompitionDto) {
    return this.driverOrderCompitionService.update(+id, updateDriverOrderCompitionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverOrderCompitionService.remove(+id);
  }
}
