import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { CreateDisputeAppealDto } from './dto/create-dispute_appeal.dto';
import { DisputeAppealQueryDto } from './dto/dispute-appeal-query.dto';
import { DisputeAppealService } from './dispute_appeal.service';

@ApiTags('Dispute Appeals')
@Controller('dispute-appeals')
export class DisputeAppealController {
  constructor(private readonly service: DisputeAppealService) { }

  @Post()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'File an appeal against a resolved dispute (User / Rider)' })
  async create(@Body() dto: CreateDisputeAppealDto, @CurrentUser() user: IUser) {
    try {
      const res = await this.service.create(dto, user);

      if (!res) {
        throw new HttpException('Failed to create appeal', HttpStatus.BAD_REQUEST);
      }

      return ApiResponses.success(res, 'Appeal filed successfully');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      return ApiResponses.error(error, 'Failed to file appeal');
    }
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all appeals (Admin)' })
  async findAll(@Query() dto: DisputeAppealQueryDto) {
    try {
      const res = await this.service.findAll(dto);
      return ApiResponses.success(res, 'Appeals fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch appeals');
    }
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single appeal (User / Rider / Admin)' })
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.service.findOne(+id);

      if (!res) {
        throw new HttpException('Appeal not found', HttpStatus.NOT_FOUND);
      }

      return ApiResponses.success(res, 'Appeal fetched successfully');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      return ApiResponses.error(error, 'Failed to fetch appeal');
    }
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an appeal (Admin)' })
  async delete(@Param('id') id: string, @CurrentUser() user: IUser) {
    try {
      const res = await this.service.delete(+id, user.id);

      if (!res) {
        throw new HttpException('Failed to delete appeal', HttpStatus.BAD_REQUEST);
      }

      return ApiResponses.success(res, 'Appeal deleted successfully');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      return ApiResponses.error(error, 'Failed to delete appeal');
    }
  }
}