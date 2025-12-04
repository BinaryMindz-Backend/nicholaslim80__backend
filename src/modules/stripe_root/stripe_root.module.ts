import { Module } from '@nestjs/common';
import { StripeRootService } from './stripe_root.service';
import { StripeRootController } from './stripe_root.controller';

@Module({
  controllers: [StripeRootController],
  providers: [StripeRootService],
})
export class StripeRootModule {}
