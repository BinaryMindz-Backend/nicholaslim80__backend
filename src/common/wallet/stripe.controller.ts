import { Controller, Post, Headers, Req, BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common'; // 👈 Import this
import { Request } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { WalletService } from './wallet.service';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly walletService: WalletService) {}

  @Post('stripe')
  @Public()
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    // If this logs "undefined", your main.ts is still wrong.
    console.log('Is rawBody available?', !!request.rawBody);

    if (!request.rawBody) {
      throw new BadRequestException(
        'Raw body is missing. Ensure rawBody:true is set in main.ts and no other body parsers are used.'
      );
    }

    // FIX: Pass request.rawBody (Buffer), NOT request.body (Object)
    return await this.walletService.handleWebhook(request.rawBody, signature);
  }
}