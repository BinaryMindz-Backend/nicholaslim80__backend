import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RidersProfileService } from './riders_profile.service';
import { CreateRidersProfileDto } from './dto/create-riders_profile.dto';
import { UpdateRidersProfileDto } from './dto/update-riders_profile.dto';

@Controller('riders-profile')
export class RidersProfileController {
  constructor(private readonly ridersProfileService: RidersProfileService) {}

  @Post()
  create(@Body() createRidersProfileDto: CreateRidersProfileDto) {
    return this.ridersProfileService.create(createRidersProfileDto);
  }

  @Get()
  findAll() {
    return this.ridersProfileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ridersProfileService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRidersProfileDto: UpdateRidersProfileDto) {
    return this.ridersProfileService.update(+id, updateRidersProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ridersProfileService.remove(+id);
  }
}
