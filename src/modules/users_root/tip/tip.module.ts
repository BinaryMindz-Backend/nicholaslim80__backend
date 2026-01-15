import { Module } from '@nestjs/common';
import { TipService } from './tip.service';
import { TipController } from './tip.controller';
import { WalletService } from 'src/common/wallet/wallet.service';
import { QueueModule } from 'src/modules/queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [TipController,],
  providers: [TipService, WalletService],
  exports: [TipService]
})
export class TipModule { }
