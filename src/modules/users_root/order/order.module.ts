import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TransactionIdService } from 'src/common/services/transaction-id.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, TransactionIdService],
})
export class OrderModule {}
