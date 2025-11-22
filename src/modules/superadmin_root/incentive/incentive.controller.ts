import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { IncentiveService } from './incentive.service';
import { CreateIncentiveDto } from './dto/create-incentive.dto';
import { UpdateIncentiveDto } from './dto/update-incentive.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('incentives (admin)') // Group endpoints under the "incentives" tag in Swagger UI
@ApiBearerAuth() // Indicates that the endpoints require a Bearer token
@Controller('incentive')
export class IncentiveController {
  constructor(private readonly incentiveService: IncentiveService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new incentive(admin only)' })
  @ApiBody({ type: CreateIncentiveDto })
  @ApiResponse({
    status: 201,
    description: 'Incentive created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() createIncentiveDto: CreateIncentiveDto) {
    try {
      const res = await this.incentiveService.create(createIncentiveDto);
      if (!res) {
        return ApiResponses.error(null, 'Failed to create incentive');
      }
      return ApiResponses.success(res, 'Incentive created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create incentive');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all incentives(admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Incentives fetched successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll() {
    try {
      const res = await this.incentiveService.findAll();
      return ApiResponses.success(res, 'Incentives fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch incentives');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an incentive by ID (admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Incentive ID' })
  @ApiResponse({
    status: 200,
    description: 'Incentive fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'Incentive not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.incentiveService.findOne(+id);
      if (!res) {
        return ApiResponses.error(null, 'Incentive not found');
      }
      return ApiResponses.success(res, 'Incentive fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch incentive');
    }
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Update an incentive by ID (admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Incentive ID' })
  @ApiBody({ type: UpdateIncentiveDto })
  @ApiResponse({
    status: 200,
    description: 'Incentive updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Incentive not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(
    @Param('id') id: string,
    @Body() updateIncentiveDto: UpdateIncentiveDto,
  ) {
    try {
      const res = await this.incentiveService.update(+id, updateIncentiveDto);
      if (!res) {
        return ApiResponses.error(null, 'Incentive not found');
      }
      return ApiResponses.success(res, 'Incentive updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update incentive');
    }
  }
// 

  @Patch(':id/status')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Update an Incentive status by ID (admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Incentive ID' })
  @ApiBody({ type: UpdateIncentiveDto })
  @ApiResponse({
    status: 200,
    description: 'Incentive statusupdated successfully',
  })
  @ApiResponse({ status: 404, description: 'Incentive not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async statusUpdate(
    @Param('id') id: string,
    @Body() updateIncentiveDto: UpdateIncentiveDto,
  ) {
    try {
      const res = await this.incentiveService.statusUpdate(+id, updateIncentiveDto);
      if (!res) {
        return ApiResponses.error(null, 'Incentive not found');
      }
      return ApiResponses.success(res, 'Incentive status updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update Incentive status');
    }
  }





  // 

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an incentive by ID (admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Incentive ID' })
  @ApiResponse({
    status: 200,
    description: 'Incentive deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Incentive not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async remove(@Param('id') id: string) {
    try {
      const res = await this.incentiveService.remove(+id);
      if (!res) {
        return ApiResponses.error(null, 'Incentive not found');
      }
      return ApiResponses.success(res, 'Incentive deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete incentive');
    }
  }
}
