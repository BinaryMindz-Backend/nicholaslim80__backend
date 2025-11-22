import { Controller, Get, Post, Body, Patch, Param, Delete, } from '@nestjs/common';
import { RidersProfileService } from './riders_profile.service';
import { CreateRidersProfileDto } from './dto/create-riders_profile.dto';
import { UpdateRidersProfileDto } from './dto/update-riders_profile.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';

import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiResponses } from 'src/common/apiResponse';

@Controller('riders-profile')
export class RidersProfileController {
  constructor(private readonly ridersProfileService: RidersProfileService) { }

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiBody({ type: CreateRidersProfileDto })
  @ApiBearerAuth()
  async create(@Body() createRidersProfileDto: CreateRidersProfileDto,
    @CurrentUser() user: IUser,
  ) {
    try {
      const res = await this.ridersProfileService.create(user.id, createRidersProfileDto);
      return ApiResponses.success(res, 'Rider profile created successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
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
