import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { DriverTierService } from './driver_tier.roles.services';
import {
  CreateDriverTierDto,
  UpdateDriverTierDto,
  PromoteRaiderDto,
} from './dto/driver_tier.roles.dto';

import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { ApiResponses } from 'src/common/apiResponse';
import { CurrentUser } from 'src/decorators/current-user.decorator';


@ApiTags('Admin - Driver Tiers')
@ApiBearerAuth()
@Controller('admin/driver-tiers')
export class DriverTierController {
  constructor(private readonly service: DriverTierService) {}

  // ================= CREATE =================
  @Post()
  @Auth()
  @RequirePermission(Module.DRIVER_TIER_ROLE, Permission.CREATE)
  @ApiOperation({ summary: 'Create Driver Tier' })
  async create(@Body() dto: CreateDriverTierDto) {
    try {
      const res = await this.service.createTier(dto);
      return ApiResponses.success(res, 'Tier created successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to create tier');
    }
  }

  // ================= GET ALL =================
  @Get()
  @Auth()
  @RequirePermission(Module.DRIVER_TIER_ROLE, Permission.READ)
  @ApiOperation({ summary: 'Get all Driver Tiers' })
  async findAll() {
    try {
      const res = await this.service.getAllTiers();
      return ApiResponses.success(res, 'Tiers fetched successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch tiers');
    }
  }

  // ================= GET BY ID =================
  @Get(':id')
  @Auth()
  @RequirePermission(Module.DRIVER_TIER_ROLE, Permission.READ)
  @ApiOperation({ summary: 'Get Driver Tier by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const res = await this.service.getTierById(id);
      return ApiResponses.success(res, 'Tier fetched successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch tier');
    }
  }

  // ================= UPDATE =================
  @Patch(':id')
  @Auth()
  @RequirePermission(Module.DRIVER_TIER_ROLE, Permission.UPDATE)
  @ApiOperation({ summary: 'Update Driver Tier' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDriverTierDto,
    @CurrentUser() adminUserId: number,
  ) {
    try {
      const res = await this.service.updateTier(id, dto, adminUserId);
      return ApiResponses.success(res, 'Tier updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to update tier');
    }
  }

  // ================= PROMOTE RAIDER =================
  @Post(':raiderId/promote')
  @Auth()
  @RequirePermission(Module.DRIVER_TIER_ROLE, Permission.UPDATE)
  @ApiOperation({ summary: 'Promote Raider to Tier' })
  async promote(
    @Param('raiderId', ParseIntPipe) raiderId: number,
    @Body() dto: PromoteRaiderDto,
    @CurrentUser() adminUserId: number, 
  ) {
    try {
      const res = await this.service.promoteRaider(raiderId, dto, adminUserId);
      return ApiResponses.success(res, 'Raider promoted successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to promote raider');
    }
  }
}