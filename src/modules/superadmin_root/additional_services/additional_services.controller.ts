import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdditionalServicesService } from './additional_services.service';
import { CreateAdditionalServiceDto } from './dto/create-additional_service.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateAdditionalServiceDto } from './dto/update-additional_service.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { ServiceEmailNumberDto } from './dto/service-email-number.dto';
import { ActivityLogQueryDto } from './dto/activity_logs.dto';
import { ActivityLogService } from './activity_logs.services';


@ApiTags('Additional Services')
@ApiBearerAuth()
@Controller('additional-services')
export class AdditionalServicesController {
  constructor(
    private readonly service: AdditionalServicesService,
    private readonly activityLogService: ActivityLogService,
  ) { }


  // 
  @Get('logs')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ADDITIONAL_ORDER_SERVICE, Permission.READ)
  @ApiOperation({ summary: 'Get all activity logs' })
  async findLogs(@Query() query: ActivityLogQueryDto) {
    try {
      const data = await this.activityLogService.findAllLogs(query);
      return ApiResponses.success(data, 'Activity logs fetched successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  // 
  @Post()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ADDITIONAL_ORDER_SERVICE, Permission.CREATE)
  @ApiOperation({ summary: 'Create additional service' })
  async create(@Body() dto: CreateAdditionalServiceDto) {
    try {
      const data = await this.service.create(dto);
      return ApiResponses.success(data, 'Additional service created successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  // get service email and number
  @Get('service-email-number')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.CONTACT_INFO, Permission.READ)
  @ApiOperation({ summary: 'Get additional service email and number' })
  async getServiceEmailNumber() {
    try {
      const data = await this.service.getServiceEmailNumber();
      return ApiResponses.success(data, 'Additional service email and number fetched successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  // update service email and number
  @Put('service-email-number/:id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.CONTACT_INFO, Permission.UPDATE)
  @ApiOperation({ summary: 'Update additional service email and number' })
  async updateServiceEmailNumber(@Param('id') id: string, @Body() dto: ServiceEmailNumberDto) {
    try {
      const data = await this.service.updateServiceEmailNumber(+id, dto);
      return ApiResponses.success(data, 'Additional service email and number updated successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }



  // delete service email and number
  @Delete('service-email-number/:id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.CONTACT_INFO, Permission.DELETE)
  @ApiOperation({ summary: 'Delete additional service email and number' })
  async deleteServiceEmailNumber(@Param('id') id: string) {
    try {
      const data = await this.service.deleteServiceEmailNumber(+id);
      return ApiResponses.success(data, 'Additional service email and number deleted successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }


  // 
  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ADDITIONAL_ORDER_SERVICE, Permission.READ)
  @ApiOperation({ summary: 'Get all additional services' })
  async findAll() {
    try {
      const data = await this.service.findAll();
      return ApiResponses.success(data, 'Additional services fetched successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ADDITIONAL_ORDER_SERVICE, Permission.READ)
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.service.findOne(+id);
      return ApiResponses.success(data, 'Additional service fetched successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Put(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ADDITIONAL_ORDER_SERVICE, Permission.UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAdditionalServiceDto,
  ) {
    try {
      const data = await this.service.update(+id, dto);
      return ApiResponses.success(data, 'Additional service updated successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ADDITIONAL_ORDER_SERVICE, Permission.DELETE)
  async remove(@Param('id') id: string) {
    try {
      const data = await this.service.remove(+id);
      return ApiResponses.success(data, 'Additional service deleted successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
}
