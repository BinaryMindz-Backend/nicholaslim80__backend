import { Module } from '@nestjs/common';
import { CoinManagementService } from './coin_management.service';
import { CoinManagementController } from './coin_management.controller';

@Module({
  controllers: [CoinManagementController],
  providers: [CoinManagementService],
})
export class CoinManagementModule {}
