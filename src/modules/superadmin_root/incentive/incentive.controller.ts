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
  Query,
} from '@nestjs/common';
import { IncentiveService } from './incentive.service';
import { CreateIncentiveDto } from './dto/create-incentive.dto';
import { UpdateIncentiveDto } from './dto/update-incentive.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
// 
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { DateByFilterDto } from '../customer_order_confirmation/dto/date-filter.dto';

@ApiTags('incentives (admin)') // Group endpoints under the "incentives" tag in Swagger UI
@ApiBearerAuth() // Indicates that the endpoints require a Bearer token
@Controller('incentive')
export class IncentiveController {
  constructor(private readonly incentiveService: IncentiveService) { }

  @Post()
  @UsePipes(new ValidationPipe())
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.WALLET, Permission.CREATE)
  @ApiOperation({ summary: 'Create a new incentive(admin only)' })
  @ApiBody({ type: CreateIncentiveDto })
  @ApiResponse({
    status: 201,
    description: 'Incentive created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() createIncentiveDto: CreateIncentiveDto, @CurrentUser() user:IUser) {
    try {
      const res = await this.incentiveService.create(createIncentiveDto, user.id, user.roles[0].name);
      if (!res) {
        return ApiResponses.error(null, 'Failed to create incentive');
      }
      return ApiResponses.success(res, 'Incentive created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create incentive');
    }
  }
   
  // 
  @Get()
  @ApiOperation({ summary: 'Get all incentives(admin and raider only)' })
  @ApiResponse({
    status: 200,
    description: 'Incentives fetched successfully',
  })
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.WALLET, Permission.READ)
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll() {
    try {
      const res = await this.incentiveService.findAll();
      return ApiResponses.success(res, 'Incentives fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch incentives');
    }
  }
  // 
  @Get()
  @ApiOperation({ summary: 'Get all incentives(raider only)' })
  @ApiResponse({
    status: 200,
    description: 'Incentives fetched successfully',
  })
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.WALLET, Permission.READ)
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAllIncentive() {
    try {
      const res = await this.incentiveService.findAllIncentive();
      return ApiResponses.success(res, 'Incentives fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch incentives');
    }
  }
  // stats
  @Get("/stats")
  @ApiOperation({ summary: 'Get all incentive stats(admin and raider only)' })
  @ApiResponse({
    status: 200,
    description: 'Incentive stats fetched successfully',
  })
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.WALLET, Permission.READ)
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async stats() {
    try {
      const res = await this.incentiveService.stats();
      return ApiResponses.success(res, 'Incentive stats fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch incentive stats');
    }
  } 
  // 
  @Get('logs')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.WALLET, Permission.READ)
  @ApiOperation({ summary: 'Get all incentive configuration change logs (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Incentive configuration logs fetched successfully',
  })
  async findAllLogs(@Query() filterDto: DateByFilterDto) {
    try {
      const res = await this.incentiveService.findAllLogs(
        filterDto.fromDate,
        filterDto.toDate,
      );

      return ApiResponses.success(
        res,
        'Incentive configuration logs fetched successfully',
      );
    } catch (err) {
      return ApiResponses.error(
        err,
        'Failed to fetch incentive configuration logs',
      );
    }
  }



  @Get(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.WALLET, Permission.READ)
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
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.WALLET, Permission.UPDATE)
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
    @CurrentUser() user:IUser
  ) {
    try {
      const res = await this.incentiveService.update(+id, updateIncentiveDto, user.id, user.roles[0].name);
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
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.WALLET, Permission.UPDATE)
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
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.WALLET, Permission.DELETE)
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
  // 
  @Post(':id/collect')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.WALLET, Permission.READ)
  @ApiOperation({ summary: 'Collect an incentive by ID (Raider only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Incentive ID' })
  @ApiResponse({
    status: 200,
    description: 'Incentive collected successfully',
  })
  @ApiResponse({ status: 404, description: 'Incentive not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async collect(@Param('id') id: string, @CurrentUser() user: IUser) {
    try {
      const res = await this.incentiveService.collect(+id, user.id);
      if (!res) {
        return ApiResponses.error(null, 'Incentive not found');
      }
      return ApiResponses.success(res, 'Incentive collected successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to collect incentive');
    }
  }
}
