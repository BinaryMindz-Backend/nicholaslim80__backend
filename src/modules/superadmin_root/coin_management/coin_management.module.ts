import { Module } from '@nestjs/common';
import { CoinManagementService } from './coin_management.service';
import { CoinManagementController } from './coin_management.controller';
import { QueueModule } from 'src/modules/queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [CoinManagementController],
  providers: [CoinManagementService],
})
export class CoinManagementModule { }
