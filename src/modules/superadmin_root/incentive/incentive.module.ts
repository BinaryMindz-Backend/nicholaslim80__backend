import { Module } from '@nestjs/common';
import { IncentiveService } from './incentive.service';
import { IncentiveController } from './incentive.controller';
import { TransactionIdService } from 'src/common/services/transaction-id.service';

@Module({
  controllers: [IncentiveController],
  providers: [IncentiveService, TransactionIdService],
})
export class IncentiveModule { }
