import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LiveMapFleetTrackService } from './live_map_fleet_track.service';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';

@ApiTags('Live Map Fleet Track')
@ApiBearerAuth()
@Controller('live-map-fleet-track')
export class LiveMapFleetTrackController {
  constructor(
    private readonly liveMapFleetTrackService: LiveMapFleetTrackService,
  ) {}

  // GET ALL
  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.LIVE_MAP, Permission.READ)
  @ApiOperation({ summary: 'Get all live fleet tracking records' })
  @ApiResponse({ status: 200, description: 'Fleet tracking data fetched successfully' })
  async findAll() {
    try {
      const res = await this.liveMapFleetTrackService.findAll();
      return ApiResponses.success(res, 'Fleet tracking list fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch fleet tracking list');
    }
  }

  // GET ONE
  @Get(':orderId')
  @Auth()
  @RequirePermission(Module.LIVE_MAP, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get live fleet tracking by ID' })
  @ApiResponse({ status: 200, description: 'Fleet tracking fetched successfully' })
  async findOne(@Param('orderId') orderId: string) {
    try {
      const res = await this.liveMapFleetTrackService.findOne(+orderId);

      if (!res) {
        return ApiResponses.error(null, 'Fleet tracking not found');
      }

      return ApiResponses.success(res, 'Fleet tracking fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch fleet tracking');
    }
  }
}
