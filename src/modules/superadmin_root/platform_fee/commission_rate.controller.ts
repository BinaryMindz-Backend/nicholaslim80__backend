import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, Query, ParseEnumPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { StandardCommissionRateService } from './commision_rate.services';
import { CreateStandardCommissionRateDto } from './dto/create-commission_rate.dto';
import { UpdateStandardCommissionRateDto } from './dto/update-platform_fee.dto';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { FeeLogType } from '@prisma/client';
import { FeeLogFilterDto } from './dto/fee-logs-filter.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';


// 
@ApiTags('Standard Commission Rate (platform fee) (admin only)')
@Controller('standard-commission-rate')
export class StandardCommissionRateController {
  constructor(private readonly service: StandardCommissionRateService) {}

  @Post()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a standard commission rate)' })
  @ApiResponse({ status: 200, description: 'Record created successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() data: CreateStandardCommissionRateDto, @CurrentUser() user:IUser) {
    try {
      const res = await this.service.create(data, user.roles[0].name, user.id);
      return ApiResponses.success(res, 'Record created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create record');
    }
  }


  @Get()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all standard commission rates' })
  @ApiResponse({ status: 200, description: 'Records fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll() {
    try {
      const res = await this.service.findAll();
      return ApiResponses.success(res, 'Records fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch records');
    }
  }
  
    // 🔹 Get all logs (with optional filters)
  @Get('logs')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.PLATFORM_FEE, Permission.READ)
  @ApiOperation({
    summary: 'Get all fee configuration change logs (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Fee configuration logs fetched successfully',
  })
  async findAlllogs(@Query() filterDto: FeeLogFilterDto) {
    try {
      const res = await this.service.getLogs(
        filterDto.logType,
        filterDto.fromDate,
        filterDto.toDate,
      );

      return ApiResponses.success(
        res,
        'Fee configuration logs fetched successfully',
      );
    } catch (err) {
      return ApiResponses.error(
        err,
        'Failed to fetch fee configuration logs',
      );
    }
  }

  // 🔹 Get logs by record (reference ID)
  @Get(':logType/:referenceId')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.PLATFORM_FEE, Permission.READ)
  @ApiOperation({
    summary: 'Get logs for a specific fee configuration record',
  })
  @ApiResponse({
    status: 200,
    description: 'Fee configuration logs fetched successfully',
  })
  async findByReference(
    @Param('logType', new ParseEnumPipe(FeeLogType)) logType: FeeLogType,
    @Param('referenceId', ParseIntPipe) referenceId: number,
  ) {
    try {
      const res = await this.service.getLogsByReference(
        logType,
        referenceId,
      );

      return ApiResponses.success(
        res,
        'Fee configuration logs fetched successfully',
      );
    } catch (err) {
      return ApiResponses.error(
        err,
        'Failed to fetch fee configuration logs',
      );
    }
  }


  // 
  @Get(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single standard commission rate by ID' })
  @ApiResponse({ status: 200, description: 'Record fetched successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const res = await this.service.findOne(id);
      return ApiResponses.success(res, 'Record fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch record');
    }
  }

  @Patch(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a standard commission rate by ID' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateStandardCommissionRateDto,
    @CurrentUser() user:IUser
  ) {
    try {
      const res = await this.service.update(id, data, user.roles[0].name,user.id);
      return ApiResponses.success(res, 'Record updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update record');
    }
  }

  @Delete(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.DELETE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a standard commission rate by ID' })
  @ApiResponse({ status: 200, description: 'Record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const res = await this.service.remove(id);
      return ApiResponses.success(res, 'Record deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete record');
    }
  }
}
