import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DestinationService } from './destination.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

import { Roles } from 'src/decorators/roles.decorator';
import { Auth } from 'src/decorators/auth.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { ApiResponses } from 'src/common/apiResponse';




@ApiTags('Destination (user)')
@ApiBearerAuth()
@Controller('destination')
@Auth()
@Roles(UserRole.USER)
export class DestinationController {
  constructor(private readonly service: DestinationService) {}

  // CREATE
  @Post()
  @ApiOperation({ summary: 'Create a new destination' })
  @ApiResponse({ status: 201, description: 'Destination created successfully' })
  async create(@Body() dto: CreateDestinationDto, @CurrentUser() user: IUser) {
    try {
      const result = await this.service.create(dto, user);
      return ApiResponses.success(result, 'Destination created successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Destination creation failed');
    }
  }

  // FIND ALL
  @Get()
  @ApiOperation({ summary: 'Get all destinations(only users)' })
  async findAll(@CurrentUser() user:IUser) {
    try {
      const result = await this.service.findAll(user);
      return ApiResponses.success(result, 'Destinations retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch destinations');
    }
  }

  // FIND ONE
  @Get(':id')
  @ApiOperation({ summary: 'Get destination by ID' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.service.findOne(+id);
      return ApiResponses.success(result, 'Destination retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch destination');
    }
  }

  // UPDATE
  @Patch(':id')
  @ApiOperation({ summary: 'Update destination by ID' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDestinationDto,
    @CurrentUser() user: IUser,
  ) {
    try {
      const result = await this.service.update(+id, dto, user);
      return ApiResponses.success(result, 'Destination updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Destination update failed');
    }
  }

  // DELETE
  @Delete(':id')
  @ApiOperation({ summary: 'Delete destination by ID' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id') id: string, @CurrentUser() user: IUser) {
    try {
      const result = await this.service.remove(+id, user);
      return ApiResponses.success(result, 'Destination deleted successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to delete destination');
    }
  }
}
