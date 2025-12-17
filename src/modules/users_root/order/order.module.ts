import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TransactionIdService } from 'src/common/services/transaction-id.service';
import { RedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  imports:[RedisModule],
  controllers: [OrderController],
  providers: [OrderService, TransactionIdService],
})
export class OrderModule {}
