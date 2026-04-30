import { Module } from '@nestjs/common';
import { WalletAdjustmentController } from './wallet_addjustment.controller';
import { WalletAdjustmentService } from './wallet_addjustment.services';
import { QueueModule } from 'src/modules/queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [WalletAdjustmentController],
  providers: [WalletAdjustmentService],
})
export class WalletAdjustmentModule {}
