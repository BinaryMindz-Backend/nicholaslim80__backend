/* eslint-disable no-useless-catch */
import { Controller, Get,Param, Delete, Query } from '@nestjs/common';
import { ReportAndAnalyticsService } from './report_and_analytics.service';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { ApiResponses } from 'src/common/apiResponse';
import { OrderAnalyticsQueryDto } from './dto/querydto';

@Controller('report-and-analytics')
export class ReportAndAnalyticsController {
  constructor(private readonly reportAndAnalyticsService: ReportAndAnalyticsService) {}

    @Get('stats')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.REPORT_ANALYTICS, Permission.READ)
    @ApiOperation({ summary: 'Get all order statistics with average order rating' })
    @ApiResponse({
      status: 200,
      description: 'Order statistics fetched successfully',
    })
    @ApiResponse({
      status: 500,
      description: 'Internal server error',
    })
    async getOrderAllStats() {
      try {
        const res = await this.reportAndAnalyticsService.getOrderAllStats();
        return ApiResponses.success(res, 'Order statistics fetched successfully');
      } catch (error) {
        throw error;
      }
    }


  @Get('analytics')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.REPORT_ANALYTICS, Permission.READ)
  @ApiOperation({ summary: 'Get order analytics stats (time-of-day, zone stats, heatmap)' })
  @ApiResponse({ status: 200, description: 'Analytics stats fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getOrderAnalyticsStats(@Query() query: OrderAnalyticsQueryDto) {
    try {
      const { from, to } = query;
      const res = await this.reportAndAnalyticsService.getOrderAnalyticsStats(
        from ? new Date(from) : undefined,
        to ? new Date(to) : undefined,
      );
      return ApiResponses.success(res, 'Analytics stats fetched successfully');
    } catch (error) {
      throw error;
    }
  } 

  //  


  @Get('kpi-stats')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.REPORT_ANALYTICS, Permission.READ)
  @ApiOperation({ summary: 'Get KPI stats: revenue by day, top drivers, AOV, completion/cancellation rate, avg delivery time' })
  @ApiResponse({
    status: 200,
    description: 'KPI stats fetched successfully',
    schema: {
      example: {
        revenueByDay: [
          { day: '2025-12-20', revenue: 1200 },
          { day: '2025-12-21', revenue: 950 },
        ],
        topDrivers: [
          { driverId: 1, driverName: 'John Doe', revenue: 5000 },
          { driverId: 2, driverName: 'Jane Smith', revenue: 4200 },
        ],
        avgOrderValue: 45.5,
        completionRate: 92.5,
        cancellationRate: 7.5,
        avgDeliveryTime: 37.8
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAdminKpiStats(@Query() query: OrderAnalyticsQueryDto) {
    try {
      const { from, to } = query;
      const res = await this.reportAndAnalyticsService.getAdminKpiStats(
        from ? new Date(from) : undefined,
        to ? new Date(to) : undefined,
      );
      return ApiResponses.success(res, 'KPI stats fetched successfully');
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportAndAnalyticsService.remove(+id);
  }
}
