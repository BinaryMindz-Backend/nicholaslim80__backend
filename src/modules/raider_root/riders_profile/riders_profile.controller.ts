import { Controller, Get, Post, Body, Patch, Param, } from '@nestjs/common';
import { RidersProfileService } from './riders_profile.service';
import { CreateRidersProfileDto } from './dto/create-riders_profile.dto';
import { UpdateRidersProfileDto } from './dto/update-riders_profile.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';

import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiResponses } from 'src/common/apiResponse';
import { RaiderVerification } from '@prisma/client';

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

  async findAll() {
    try {
      const res = await this.ridersProfileService.findAll();
      return ApiResponses.success(res, 'Rider profiles fetched successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.ridersProfileService.findOne(id);
      return ApiResponses.success(res, 'Rider profile fetched successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Patch(':id/:verify')
  @Auth()
  async verifyRiderProfile(@Param('id') id: string, @Param('verify') verify: RaiderVerification) {
    try {
      const res = await this.ridersProfileService.verifyRiderProfile(Number(id), verify);
      return ApiResponses.success(res, 'Rider profile verified successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Patch('update-rider-profile')
  @Auth()
  @ApiBearerAuth()
  async update(@Body() updateRidersProfileDto: UpdateRidersProfileDto, @CurrentUser() user: IUser) {
    try {
      const res = await this.ridersProfileService.update(user.id, updateRidersProfileDto);
      return ApiResponses.success(res, 'Rider profile updated successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }


}
