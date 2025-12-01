import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserDynamicSurgeService } from './dynamic_surge.services';
import { Auth } from 'src/decorators/auth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateUserDynamicSurgeDto } from './dto/create_dynamic_surge.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateUserDynamicSurgeDto } from './dto/update-platform_fee.dto';


@ApiTags('User Dynamic Surge (platform fee) (admin only)')
@Controller('user-dynamic-surge')
export class UserDynamicSurgeController {
  constructor(private readonly service: UserDynamicSurgeService) {}

  @Post()
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new dynamic surge rule' })
  async create(@Body() dto: CreateUserDynamicSurgeDto) {
    try {
      const res = await this.service.create(dto);
      return ApiResponses.success(res, 'Dynamic surge created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create dynamic surge');
    }
  }

  @Get()
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a dynamic surge rule' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDynamicSurgeDto,
  ) {
    try {
      const res = await this.service.update(id, dto);
      return ApiResponses.success(res, 'Dynamic surge updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update record');
    }
  }

  @Delete(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
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
