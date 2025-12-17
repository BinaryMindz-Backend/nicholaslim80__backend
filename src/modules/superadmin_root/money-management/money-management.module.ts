import { Module } from '@nestjs/common';
import { MoneyManagementService } from './money-management.service';
import { MoneyManagementController } from './money-management.controller';

@Module({
  controllers: [MoneyManagementController],
  providers: [MoneyManagementService],
})
export class MoneyManagementModule {}
