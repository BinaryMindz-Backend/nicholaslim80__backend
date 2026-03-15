import { CurrentUser } from '../../../decorators/current-user.decorator';
import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { VehicleTypeService } from './vehicle-type.service';
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';
import { UpdateVehicleTypeDto } from './dto/update-vehicle-type.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiResponses } from 'src/common/apiResponse';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { Public } from 'src/decorators/public.decorator';
import type { IUser } from 'src/types';




@ApiTags('Vehicle Type (admin)')
@Controller('admin/vehicle-types')
export class VehicleTypeController {
  constructor(private readonly service: VehicleTypeService) { }


  // CREATE
  @Post('create')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.VEHICLE_TYPE, Permission.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Vehicle Type (Admin only)' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiResponse({ status: 201, description: 'Vehicle Type created successfully' })
  async create(@Body() dto: CreateVehicleTypeDto, @CurrentUser() user: IUser) {
    try {
      const result = await this.service.create(dto, user);
      return ApiResponses.success(result, 'Vehicle Type created successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Vehicle Type creation failed');
    }
  }

  // GET ALL
  @Get()
  @Public()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all Vehicle Types' })
  @ApiResponse({ status: 200, description: 'List of Vehicle Types' })
  async findAll() {
    try {
      const result = await this.service.findAll();
      return ApiResponses.success(result, 'Vehicle Types fetched successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch Vehicle Types');
    }
  }


  // GET ONE (ACTIVE)
  @Get(':id')
  @Public()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Vehicle Type by ID' })
  @ApiParam({ name: 'id', description: 'Vehicle Type ID' })
  async findOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
    id: number
  ) {
    try {
      const result = await this.service.findOne(id);
      if (!result) return ApiResponses.error(null, 'Vehicle Type not found');

      return ApiResponses.success(result, 'Vehicle Type fetched successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch Vehicle Type');
    }
  }


  // UPDATE
  @Patch('update/:id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.VEHICLE_TYPE, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Vehicle Type (Admin only)' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiParam({ name: 'id', description: 'Vehicle Type ID' })
  async update(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
    id: number,
    @Body() dto: UpdateVehicleTypeDto,
  ) {
    try {
      const result = await this.service.update(id, dto);
      return ApiResponses.success(result, 'Vehicle Type updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to update Vehicle Type');
    }
  }


  //DELETE
  @Delete('delete/:id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.VEHICLE_TYPE, Permission.DELETE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'delete Vehicle Type' })
  @ApiParam({ name: 'id', description: 'Vehicle Type ID' })
  async softDelete(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
    id: number
  ) {
    try {
      const result = await this.service.Delete(id);
      return ApiResponses.success(result, 'Vehicle Type deleted successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to delete Vehicle Type');
    }
  }





}
