import { Module } from '@nestjs/common';
import { IncentiveService } from './incentive.service';
import { IncentiveController } from './incentive.controller';
import { TransactionIdService } from 'src/common/services/transaction-id.service';
import { IncentiveCronService } from './incentive_corn.serviec';

@Module({
  controllers: [IncentiveController],
  providers: [IncentiveService, TransactionIdService, IncentiveCronService],
})
export class IncentiveModule { }
