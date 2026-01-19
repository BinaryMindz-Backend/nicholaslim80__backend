import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RaiderDeductionFeeService } from './deduction_fee.service';
import { Auth } from 'src/decorators/auth.decorator';
import { CreateRaiderDeductionFeeDto } from './dto/create_deduction_fee.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateRaiderDeductionFeeDto } from './dto/update-platform_fee.dto';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';


@ApiTags('Raider Deduction Fee (platform fee) (admin only)')
@Controller('raider-deduction-fee')
export class RaiderDeductionFeeController {
  constructor(private readonly service: RaiderDeductionFeeService) {}

  @Post()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a raider deduction fee' })
  async create(@Body() dto: CreateRaiderDeductionFeeDto, @CurrentUser() user:IUser) {
    try {
      const res = await this.service.create(dto, user.role.name, user.id);
      return ApiResponses.success(res, 'Raider deduction fee created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create record');
    }
  }

  @Get()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all raider deduction fees' })
  async findAll() {
    try {
      const res = await this.service.findAll();
      return ApiResponses.success(res, 'Records fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch records');
    }
  }

  @Get(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single raider deduction fee by ID' })
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
  @ApiOperation({ summary: 'Update a raider deduction fee by ID' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRaiderDeductionFeeDto, @CurrentUser() user:IUser) {
    try {
      const res = await this.service.update(id, dto, user.role.name, user.id);
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
  @ApiOperation({ summary: 'Delete a raider deduction fee by ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const res = await this.service.remove(id);
      return ApiResponses.success(res, 'Record deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete record');
    }
  }
}
