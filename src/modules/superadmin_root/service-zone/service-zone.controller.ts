import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ServiceZoneService } from './service-zone.service';
import { CreateServiceZoneDto } from './dto/create-service-zone.dto';
import { UpdateServiceZoneDto } from './dto/update-service-zone.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApiResponses } from 'src/common/apiResponse';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';

@Controller('service-zone')
export class ServiceZoneController {
  constructor(private readonly serviceZoneService: ServiceZoneService) { }

  @Post('create')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.VEHICLE_TYPE, Permission.CREATE)
  async create(@Body() createServiceZoneDto: CreateServiceZoneDto) {

    const rest = await this.serviceZoneService.create(createServiceZoneDto);
    return ApiResponses.success(rest, 'Service zone created successfully');
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.VEHICLE_TYPE, Permission.READ)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(@Query() query: any) {
    const res = await this.serviceZoneService.findAll(query);
    return ApiResponses.success(res, 'Service zones fetched successfully');
  }

  @Patch('update-status:id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.VEHICLE_TYPE, Permission.UPDATE)
  async updateActiveStatus(@Param('id') id: string) {
    const res = await this.serviceZoneService.updateActiveStatus(+id);
    return ApiResponses.success(res, 'Service zone status updated successfully');
  }

  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.VEHICLE_TYPE, Permission.UPDATE)
  async update(@Param('id') id: string, @Body() updateServiceZoneDto: UpdateServiceZoneDto) {

    const res = await this.serviceZoneService.update(+id, updateServiceZoneDto);
    return ApiResponses.success(res, 'Service zone updated successfully');
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.VEHICLE_TYPE, Permission.DELETE)
  async remove(@Param('id') id: string) {
    const res = await this.serviceZoneService.remove(+id);
    return ApiResponses.success(res, 'Service zone deleted successfully');
  }
}
