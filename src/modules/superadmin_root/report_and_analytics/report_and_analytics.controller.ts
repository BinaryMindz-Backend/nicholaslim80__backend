/* eslint-disable no-useless-catch */
import { Controller, Get, Query } from '@nestjs/common';
import { ReportAndAnalyticsService } from './report_and_analytics.service';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
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
  // 
  
  @Get('coin/stats')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.REPORT_ANALYTICS, Permission.READ)
  @ApiOperation({ summary: 'Get coin management stats for admin dashboard' })
  @ApiResponse({ status: 200, description: 'Coin stats fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCoinStats(@Query() query: OrderAnalyticsQueryDto) {
    try {
      const res = await this.reportAndAnalyticsService.getAdminCoinStats(
        query.from ? new Date(query.from) : undefined,
        query.to ? new Date(query.to) : undefined,
      );
      return ApiResponses.success(res, 'Coin stats fetched successfully');
    } catch (error) {
      throw error;
    }
  }

  // 
  @Get('incentive/analytics')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.REPORT_ANALYTICS, Permission.READ)
  @ApiOperation({ summary: 'Get incentive analytics (total given, collected, weekly chart)' })
  @ApiResponse({ status: 200, description: 'Incentive analytics fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getIncentiveAnalytics(@Query() query: OrderAnalyticsQueryDto) {
    try {
      const res = await this.reportAndAnalyticsService.getIncentiveAnalytics(
        query.from ? new Date(query.from) : undefined,
        query.to ? new Date(query.to) : undefined,
      );
      return ApiResponses.success(res, 'Incentive analytics fetched successfully');
    } catch (error) {
      throw error;
    }
  }
  

  // Get weekly performance for a single driver
  @Get('performance')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.REPORT_ANALYTICS, Permission.READ)
  @ApiOperation({ summary: 'Get weekly performance of a driver' })
  @ApiQuery({ name: 'month', enum: ['THIS_MONTH', 'LAST_MONTH'], required: false })
  async getDriverWeeklyPerformance(
    @Query('month') month?: 'THIS_MONTH' | 'LAST_MONTH',
  ) {
    try {
      const stats = await this.reportAndAnalyticsService.getDriverWeeklyPerformance(month);
      return { data: stats, message: 'Driver weekly performance fetched successfully' };
    } catch (err) {
      return { error: err.message, message: 'Failed to fetch driver performance' };
    }
  }

  // Get top drivers
  @Get('top')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.REPORT_ANALYTICS, Permission.READ)
  @ApiOperation({ summary: 'Get top drivers based on completed orders and ratings' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of top drivers to fetch' })
  async getTopDrivers(@Query('limit') limit?: number) {
    try {
      const topDrivers = await this.reportAndAnalyticsService.getTopDrivers(limit);
      return { data: topDrivers, message: 'Top drivers fetched successfully' };
    } catch (err) {
      return { error: err.message, message: 'Failed to fetch top drivers' };
    }
  }


// 
}
