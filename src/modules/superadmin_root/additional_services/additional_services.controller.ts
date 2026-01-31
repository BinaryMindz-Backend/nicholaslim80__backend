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
import { AdditionalServicesService } from './additional_services.service';
import { CreateAdditionalServiceDto } from './dto/create-additional_service.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateAdditionalServiceDto } from './dto/update-additional_service.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';


@ApiTags('Additional Services')
@ApiBearerAuth()
@Controller('additional-services')
export class AdditionalServicesController {
  constructor(private readonly service: AdditionalServicesService) {}

  @Post()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ADDITIONAL_SERVICES, Permission.CREATE)
  @ApiOperation({ summary: 'Create additional service' })
  async create(@Body() dto: CreateAdditionalServiceDto) {
    try {
      const data = await this.service.create(dto);
      return ApiResponses.success(data, 'Additional service created successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ADDITIONAL_SERVICES, Permission.READ)
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
  @RequirePermission(Module.ADDITIONAL_SERVICES, Permission.READ)
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
  @RequirePermission(Module.ADDITIONAL_SERVICES, Permission.UPDATE)
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
  @RequirePermission(Module.ADDITIONAL_SERVICES, Permission.DELETE)
  async remove(@Param('id') id: string) {
    try {
      const data = await this.service.remove(+id);
      return ApiResponses.success(data, 'Additional service deleted successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
}
