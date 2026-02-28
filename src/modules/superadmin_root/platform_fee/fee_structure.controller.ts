import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserFeeStructureService } from './fee_structure.service';
import { Auth } from 'src/decorators/auth.decorator';
import { CreateUserFeeStructureDto } from './dto/create_ user_fee_structure.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateUserFeeStructureDto } from './dto/update-platform_fee.dto';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';


@ApiTags('User Fee Structure (platform fee) (admin only)')
@Controller('user-fee-structure')
export class UserFeeStructureController {
  constructor(private readonly service: UserFeeStructureService) {}

  @Post()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.REVENUE_CONFIGURATION, Permission.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a user fee structure' })
  async create(@Body() dto: CreateUserFeeStructureDto, @CurrentUser() user:IUser) {
    try {
      const res = await this.service.create(dto, user.roles[0].name, user.id);
      return ApiResponses.success(res, 'User fee structure created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create record');
    }
  }

  @Get()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.REVENUE_CONFIGURATION, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user fee structures' })
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
  @RequirePermission(Module.REVENUE_CONFIGURATION, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single user fee structure by ID' })
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
  @RequirePermission(Module.REVENUE_CONFIGURATION, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user fee structure by ID' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserFeeStructureDto, @CurrentUser() user:IUser) {
    try {
      const res = await this.service.update(id, dto, user.roles[0].name, user.id);
      return ApiResponses.success(res, 'Record updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update record');
    }
  }

  @Delete(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.REVENUE_CONFIGURATION, Permission.DELETE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user fee structure by ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const res = await this.service.remove(id);
      return ApiResponses.success(res, 'Record deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete record');
    }
  }
}
