import { forwardRef, Module } from '@nestjs/common';
import { TipService } from './tip.service';
import { TipController } from './tip.controller';
import { WalletService } from 'src/common/wallet/wallet.service';
import { QueueModule } from 'src/modules/queue/queue.module';
import { RaiderModule } from 'src/modules/raider_root/raider gateways/raider.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [QueueModule, forwardRef(() => RaiderModule), forwardRef(() => UsersModule)],
  controllers: [TipController],
  providers: [TipService, WalletService],
  exports: [TipService]
})
export class TipModule { }
