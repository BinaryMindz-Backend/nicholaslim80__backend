// my-raider.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MyRaiderService } from './my_raider.service';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/decorators/roles.decorator';
import { Auth } from 'src/decorators/auth.decorator';
import { CreateMyRaiderDto } from './dto/create-my_raider.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateMyRaiderDto } from './dto/update-my_raider.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';

@ApiTags('My Raiders (User Only)')
@Controller('my-raider')
export class MyRaiderController {
  constructor(private readonly myRaiderService: MyRaiderService) {}

  @Post()
  @Auth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create my raider entry' })
  @ApiResponse({ status: 201, description: 'My Raider created successfully' })
  async create(@Body() dto: CreateMyRaiderDto, @CurrentUser() user:IUser) {
    try {
      const data = await this.myRaiderService.create(dto,user);
      return ApiResponses.success(data, 'My Raider created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create My Raider');
    }
  }

  @Get(':userID')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all my raiders' })
  async findAll(@Param("userID") id:string) {
    try {
      const data = await this.myRaiderService.findAll(+id);
      return ApiResponses.success(data, 'My Raiders fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch My Raiders');
    }
  }

  @Get(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single my raider by ID' })
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.myRaiderService.findOne(+id);
      return ApiResponses.success(data, 'My Raider fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch My Raider');
    }
  }

  @Patch(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my raider' })
  async update(@Param('id') id: string, @Body() dto: UpdateMyRaiderDto) {
    try {
      const data = await this.myRaiderService.update(+id, dto);
      return ApiResponses.success(data, 'My Raider updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update My Raider');
    }
  }

  @Delete(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete my raider' })
  async remove(@Param('id') id: string) {
    try {
      const data = await this.myRaiderService.remove(+id);
      return ApiResponses.success(data, 'My Raider deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete My Raider');
    }
  }
}
