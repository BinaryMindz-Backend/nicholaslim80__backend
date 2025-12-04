/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import Stripe from 'stripe';
export const stripeProvider = {
  provide: "STRIPE_CLIENT",
  useFactory: () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    return new Stripe(secretKey, {
      apiVersion: "2025-10-29.clover" as Stripe.LatestApiVersion,
    });
  },
};
@Module({
  imports: [StripeModule],
  controllers: [StripeController],
  providers: [StripeService, stripeProvider],
  exports: [StripeService],

})
export class StripeModule { }
