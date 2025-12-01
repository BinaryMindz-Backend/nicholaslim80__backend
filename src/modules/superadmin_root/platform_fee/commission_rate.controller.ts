import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { StandardCommissionRateService } from './commision_rate.services';
import { CreateStandardCommissionRateDto } from './dto/create-commission_rate.dto';
import { UpdateStandardCommissionRateDto } from './dto/update-platform_fee.dto';


// 
@ApiTags('Standard Commission Rate (platform fee) (admin only)')
@Controller('standard-commission-rate')
export class StandardCommissionRateController {
  constructor(private readonly service: StandardCommissionRateService) {}

  @Post()
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a standard commission rate)' })
  @ApiResponse({ status: 200, description: 'Record created successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() data: CreateStandardCommissionRateDto) {
    try {
      const res = await this.service.create(data);
      return ApiResponses.success(res, 'Record created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create record');
    }
  }


  @Get()
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
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

  @Get(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a standard commission rate by ID' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateStandardCommissionRateDto,
  ) {
    try {
      const res = await this.service.update(id, data);
      return ApiResponses.success(res, 'Record updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update record');
    }
  }

  @Delete(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
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
