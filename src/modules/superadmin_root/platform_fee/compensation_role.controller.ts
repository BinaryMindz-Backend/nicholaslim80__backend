import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation,ApiTags } from '@nestjs/swagger';
import { RaiderCompensationRoleService } from './compensation_role.service';
import { Auth } from 'src/decorators/auth.decorator';
import { CreateRaiderCompensationRoleDto } from './dto/create_compensation_role.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateRaiderCompensationRoleDto } from './dto/update-platform_fee.dto';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';




@ApiTags('Raider Compensation Role (platform me) (admin only)')
@Controller('raider-compensation-role')
export class RaiderCompensationRoleController {
  constructor(private readonly service: RaiderCompensationRoleService) {}

  @Post()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a raider compensation role' })
  async create(@Body() dto: CreateRaiderCompensationRoleDto) {
    try {
      const res = await this.service.create(dto);
      return ApiResponses.success(res, 'Raider compensation role created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create record');
    }
  }

  @Get()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.PLATFORM_FEE, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all raider compensation roles' })
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
  @ApiOperation({ summary: 'Get a single raider compensation role by ID' })
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
  @ApiOperation({ summary: 'Update a raider compensation role by ID' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRaiderCompensationRoleDto,
  ) {
    try {
      const res = await this.service.update(id, dto);
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
  @ApiOperation({ summary: 'Delete a raider compensation role by ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const res = await this.service.remove(id);
      return ApiResponses.success(res, 'Record deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete record');
    }
  }
}
