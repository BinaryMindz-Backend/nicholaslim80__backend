import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserDynamicSurgeService } from './dynamic_surge.services';
import { Auth } from 'src/decorators/auth.decorator';
import { CreateUserDynamicSurgeDto } from './dto/create_dynamic_surge.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateUserDynamicSurgeDto } from './dto/update-platform_fee.dto';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';


@ApiTags('User Dynamic Surge (platform fee) (admin only)')
@Controller('user-dynamic-surge')
export class UserDynamicSurgeController {
  constructor(private readonly service: UserDynamicSurgeService) {}

  @Post()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new dynamic surge rule' })
  async create(@Body() dto: CreateUserDynamicSurgeDto, @CurrentUser() user:IUser) {
    try {
      const res = await this.service.create(dto, user.roles[0].name, user.id);
      return ApiResponses.success(res, 'Dynamic surge created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create dynamic surge');
    }
  }

  @Get()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all dynamic surge rules' })
  async findAll() {
    try {
      const res = await this.service.findAll();
      return ApiResponses.success(res, 'Dynamic surge records fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch records');
    }
  }

  @Get(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dynamic surge rule by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const res = await this.service.findOne(id);
      return ApiResponses.success(res, 'Dynamic surge fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch record');
    }
  }

  @Patch(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a dynamic surge rule' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDynamicSurgeDto,
    @CurrentUser() user:IUser
  ) {
    try {
      const res = await this.service.update(id, dto, user.roles[0].name, user.id);
      return ApiResponses.success(res, 'Dynamic surge updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update record');
    }
  }
  // 
  @Patch('status/:id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update active status a dynamic surge rule' })
  async updateStaus(
    @Param('id', ParseIntPipe) id: number
  ) {
    try {
      const res = await this.service.updateStaus(id);
      return ApiResponses.success(res, 'Dynamic surge Active status updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update record');
    }
  }



  @Delete(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.DELETE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a dynamic surge rule' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const res = await this.service.remove(id);
      return ApiResponses.success(res, 'Dynamic surge deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete record');
    }
  }
}
