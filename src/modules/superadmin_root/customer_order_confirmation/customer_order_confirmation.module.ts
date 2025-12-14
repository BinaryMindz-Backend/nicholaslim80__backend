import { Module } from '@nestjs/common';
import { CustomerOrderConfirmationService } from './customer_order_confirmation.service';
import { CustomerOrderConfirmationController } from './customer_order_confirmation.controller';

@Module({
  controllers: [CustomerOrderConfirmationController],
  providers: [CustomerOrderConfirmationService],
})
export class CustomerOrderConfirmationModule {}
