import { Module } from '@nestjs/common';
import { DashboardPopupService } from './dashboard_popup.service';
import { DashboardPopupController } from './dashboard_popup.controller';

@Module({
  controllers: [DashboardPopupController],
  providers: [DashboardPopupService],
})
export class DashboardPopupModule {}
