/* eslint-disable @typescript-eslint/await-thenable */
import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LiveMapFleetTrackService } from './live_map_fleet_track.service';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';

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
  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get live fleet tracking by ID' })
  @ApiResponse({ status: 200, description: 'Fleet tracking fetched successfully' })
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.liveMapFleetTrackService.findOne(+id);

      if (!res) {
        return ApiResponses.error(null, 'Fleet tracking not found');
      }

      return ApiResponses.success(res, 'Fleet tracking fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch fleet tracking');
    }
  }
}
