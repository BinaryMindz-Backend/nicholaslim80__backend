import { Module } from '@nestjs/common';
import { CoinManagementService } from './coin_management.service';
import { CoinManagementController } from './coin_management.controller';
import { QueueModule } from 'src/modules/queue/queue.module';
import { TransactionIdService } from 'src/common/services/transaction-id.service';

@Module({
  imports: [QueueModule],
  controllers: [CoinManagementController],
  providers: [CoinManagementService, TransactionIdService],
  exports:[
    TransactionIdService
  ]
})
export class CoinManagementModule { }
