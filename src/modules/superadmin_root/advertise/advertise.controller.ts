import { CurrentUser } from './../../../decorators/current-user.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { AdvertiseService } from './advertise.service';
import { CreateAdvertiseDto } from './dto/create-advertise.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { UpdateAdvertiseDto } from './dto/update-advertise.dto';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { IUser } from 'src/types';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';

@ApiTags('Advertise')
@Controller('advertise')
export class AdvertiseController {
  constructor(private readonly advertiseService: AdvertiseService) {}

  // CREATE
  @Post()
  @ApiOperation({ summary: 'Create a new advertisement' })
  @Auth()
  @RequirePermission(Module.ADVERTISEMENT, Permission.CREATE)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Advertise created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async create(@Body() dto: CreateAdvertiseDto) {
    try {
      const res = await this.advertiseService.create(dto);
      if (!res) {
        return ApiResponses.error(null, 'Failed to create advertise');
      }
      return ApiResponses.success(res, 'Advertise created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create advertise');
    }
  }

  // FIND ALL (PAGINATED)
  @Get()
  @Auth()
  @RequirePermission(Module.ADVERTISEMENT, Permission.JUST_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of advertisements for admin (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Advertise list fetched successfully' })
  async findAll(@Query() pagination: PaginationDto) {
    try {
      const res = await this.advertiseService.findAll(
        pagination.page,
        pagination.limit,
      );
      return ApiResponses.success(res, 'Advertise list fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch advertisements');
    }
  }

  // FIND ALL (PAGINATED)
  @Get("/role-based")
  @Auth()
  @RequirePermission(Module.ADVERTISEMENT, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of advertisements for users raider (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Advertise list fetched successfully' })
  async findAllRoleBased(@Query() pagination: PaginationDto, @CurrentUser() user:IUser ) {
    try {
      const res = await this.advertiseService.findAllRoleBased(
        pagination.page,
        pagination.limit,
        user.role.name
      );
      return ApiResponses.success(res, 'Advertise list fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch advertisements');
    }
  }


  // GLOBAL STATS
  @Get('stats/global')
  @Auth()
  @RequirePermission(Module.ADVERTISEMENT, Permission.JUST_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get global advertisement statistics' })
  @ApiResponse({ status: 200, description: 'Total stats fetched successfully' })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    example: 'USER',
    description: 'Filter stats based on role (optional)',
  })
  async getGlobalStats(@Query('role') role: string) {
    try {
      const res = await this.advertiseService.getTotalStats(role);
      return ApiResponses.success(res, 'Total advertise stats fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch global stats');
    }
  }
  
    // GLOBAL STATS
    @Get('stats/performance-trends')
    @Auth()
    @RequirePermission(Module.ADVERTISEMENT, Permission.JUST_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get global advertisement performance trends' })
    @ApiResponse({ status: 200, description: 'Performance stats fetched successfully' })
    @ApiQuery({
      name: 'role',
      required: false,
      type: String,
      example: 'USER',
      description: 'Filter stats based on role (optional)',
    })
    @ApiQuery({
      name: 'months',
      required: false,
      type: Number,
      example: 3,
      description: 'Number of past months to include (1, 2, or 3)',
    })
    async getPerformanceTrands(
      @Query('role') role?: string,
      @Query('months') months?: number,
    ) {
      try {
        const res = await this.advertiseService.getPerformanceTrands(role, months);
        return ApiResponses.success(res, 'Advertise performance trends fetched successfully');
      } catch (error) {
        return ApiResponses.error(error, 'Failed to fetch performance trends');
      }
    }



  // FIND ONE
  @Get(':id')
  @Auth()
  @RequirePermission(Module.ADVERTISEMENT, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get advertisement by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Advertise fetched successfully' })
  @ApiResponse({ status: 404, description: 'Advertise not found' })
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.advertiseService.findOne(+id);
      if (!res) return ApiResponses.error(null, 'Advertise not found');

      return ApiResponses.success(res, 'Advertise fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch advertise');
    }
  }

  // UPDATE
  @Patch(':id')
  @Auth()
  @RequirePermission(Module.ADVERTISEMENT, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update advertisement by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Advertise updated successfully' })
  @ApiResponse({ status: 404, description: 'Advertise not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateAdvertiseDto) {
    try {
      const res = await this.advertiseService.update(+id, dto);
      if (!res) return ApiResponses.error(null, 'Failed to update advertise');

      return ApiResponses.success(res, 'Advertise updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update advertise');
    }
  }
  
  // UPDATE status
  @Patch('status/:id')
  @Auth()
  @RequirePermission(Module.ADVERTISEMENT, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update advertisement status by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Advertise  status updated successfully' })
  @ApiResponse({ status: 404, description: 'Advertise not found' })
  async statusUpdate(@Param('id') id: string) {
    try {
      const res = await this.advertiseService.statusUpdate(+id);
      if (!res) return ApiResponses.error(null, 'Failed to update advertise status');

      return ApiResponses.success(res, 'Advertise updated ststus successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update advertise');
    }
  }


  // DELETE
  @Delete(':id')
  @Auth()
  @RequirePermission(Module.ADVERTISEMENT, Permission.DELETE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete advertisement by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Advertise deleted successfully' })
  @ApiResponse({ status: 404, description: 'Advertise not found' })
  async remove(@Param('id') id: string) {
    try {
      const res = await this.advertiseService.remove(+id);
      if (!res) return ApiResponses.error(null, 'Failed to delete advertise');

      return ApiResponses.success(res, 'Advertise deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete advertise');
    }
  }

  // SINGLE AD STATS
  @Get(':id/stats')
  @Auth()
  @RequirePermission(Module.ADVERTISEMENT, Permission.JUST_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get statistics for a single advertisement' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Advertise stats fetched successfully' })
  async getStats(@Param('id') id: string) {
    try {
      const res = await this.advertiseService.getStats(+id);
      return ApiResponses.success(res, 'Advertise stats fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch advertise stats');
    }
  }

  // RECORD IMPRESSION
  @Post(':id/impression')
  @Auth()
  @RequirePermission(Module.ADVERTISEMENT, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record an impression on advertisement' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Impression recorded successfully' })
  async addImpression(@Param('id') id: string) {
    try {
      const res = await this.advertiseService.addImpression(+id);

      if (!res) {
        return ApiResponses.error(null, 'Failed to record impression');
      }

      return ApiResponses.success(res, 'Impression recorded successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to record impression');
    }
  }

  // RECORD CLICK
  @Post(':id/click')
  @Auth()
  @RequirePermission(Module.ADVERTISEMENT, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a click on advertisement' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Click recorded successfully' })
  async addClick(@Param('id') id: string) {
    try {
      const res = await this.advertiseService.addClick(+id);

      if (!res) {
        return ApiResponses.error(null, 'Failed to record click');
      }

      return ApiResponses.success(res, 'Click recorded successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to record click');
    }
  }
}
