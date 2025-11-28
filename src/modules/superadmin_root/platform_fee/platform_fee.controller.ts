import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlatformFeeService } from './platform_fee.service';
import { CreatePlatformFeeDto } from './dto/create-platform_fee.dto';
import { UpdatePlatformFeeDto } from './dto/update-platform_fee.dto';

@Controller('platform-fee')
export class PlatformFeeController {
  constructor(private readonly platformFeeService: PlatformFeeService) {}

  @Post()
  create(@Body() createPlatformFeeDto: CreatePlatformFeeDto) {
    return this.platformFeeService.create(createPlatformFeeDto);
  }

  @Get()
  findAll() {
    return this.platformFeeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.platformFeeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlatformFeeDto: UpdatePlatformFeeDto) {
    return this.platformFeeService.update(+id, updatePlatformFeeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.platformFeeService.remove(+id);
  }
}
