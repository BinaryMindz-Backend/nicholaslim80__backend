import { Module } from '@nestjs/common';
import { PaymentMethodController } from './payment-option.controller';
import { PaymentMethodService } from './payment-option.service';


@Module({
  controllers: [PaymentMethodController],
  providers: [PaymentMethodService],
})
export class PaymentOptionModule {}
