import { Module } from '@nestjs/common';
import { ReportAndAnalyticsService } from './report_and_analytics.service';
import { ReportAndAnalyticsController } from './report_and_analytics.controller';

@Module({
  controllers: [ReportAndAnalyticsController],
  providers: [ReportAndAnalyticsService],
})
export class ReportAndAnalyticsModule {}
