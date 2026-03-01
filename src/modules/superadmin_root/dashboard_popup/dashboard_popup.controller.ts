import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardPopupService } from './dashboard_popup.service';
import { CreateDashboardPopupDto } from './dto/create-dashboard_popup.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateDashboardPopupDto } from './dto/update-dashboard_popup.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';

@ApiTags('Dashboard Popup')
@ApiBearerAuth()
@Controller('dashboard-popup')
export class DashboardPopupController {
  constructor(private readonly service: DashboardPopupService) {}

  @Post()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.DASHBOARD_POPUP, Permission.CREATE)
  @ApiOperation({ summary: 'Create dashboard popup' })
  async create(@Body() dto: CreateDashboardPopupDto) {
    try {
      const data = await this.service.create(dto);
      return ApiResponses.success(data, 'Dashboard popup created successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.DASHBOARD_POPUP, Permission.READ)  
  @ApiOperation({ summary: 'Get all dashboard popups' })
  async findAll() {
    try {
      const data = await this.service.findAll();
      return ApiResponses.success(data, 'Dashboard popups fetched successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.DASHBOARD_POPUP, Permission.READ)  
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.service.findOne(+id);
      return ApiResponses.success(data, 'Dashboard popup fetched successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Put(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.DASHBOARD_POPUP, Permission.UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDashboardPopupDto,
  ) {
    try {
      const data = await this.service.update(+id, dto);
      return ApiResponses.success(data, 'Dashboard popup updated successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.DASHBOARD_POPUP, Permission.DELETE)
  async remove(@Param('id') id: string) {
    try {
      const data = await this.service.remove(+id);
      return ApiResponses.success(data, 'Dashboard popup deleted successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
}
