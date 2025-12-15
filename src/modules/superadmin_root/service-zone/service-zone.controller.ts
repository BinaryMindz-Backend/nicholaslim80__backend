import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceZoneService } from './service-zone.service';
import { CreateServiceZoneDto } from './dto/create-service-zone.dto';
import { UpdateServiceZoneDto } from './dto/update-service-zone.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponses } from 'src/common/apiResponse';

@Controller('service-zone')
export class ServiceZoneController {
  constructor(private readonly serviceZoneService: ServiceZoneService) { }

  @Post('create')
  @Auth()
  @ApiBearerAuth()
  async create(@Body() createServiceZoneDto: CreateServiceZoneDto) {

    const rest = await this.serviceZoneService.create(createServiceZoneDto);
    return ApiResponses.success(rest, 'Service zone created successfully');
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  async findAll() {
    const res = await this.serviceZoneService.findAll();
    return ApiResponses.success(res, 'Service zones fetched successfully');
  }

  @Patch('update-status:id')
  @Auth()
  @ApiBearerAuth()
  async updateActiveStatus(@Param('id') id: string) {
    const res = await this.serviceZoneService.updateActiveStatus(+id);
    return ApiResponses.success(res, 'Service zone status updated successfully');
  }

  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateServiceZoneDto: UpdateServiceZoneDto) {
    return await this.serviceZoneService.update(+id, updateServiceZoneDto);
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return await this.serviceZoneService.remove(+id);
  }
}
