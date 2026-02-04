import { Controller, Post, Req, Headers, BadRequestException } from '@nestjs/common';
import type {RawBodyRequest} from '@nestjs/common';
import { Request } from 'express';
import { WalletService } from './wallet.service';


@Controller('webhooks')
export class WebhookController {
  constructor(private readonly walletService: WalletService) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string, // Secure header from Stripe
    @Req() request: RawBodyRequest<Request>,        // Request with .rawBody
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // We pass the rawBody buffer directly to the service
    return  await this.walletService.handleWebhook(request.rawBody!, signature);
  }
}