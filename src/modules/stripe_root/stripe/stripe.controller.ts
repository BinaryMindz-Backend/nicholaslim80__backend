import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdatePaymentDataDto } from './dto/update-payment-data.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { Auth } from 'src/decorators/auth.decorator';
import { AddFundsDto } from './dto/add-funds.dto';
import { Public } from 'src/decorators/public.decorator';
export interface IUser {
  id: number;
  email: string;
  phone: string;
  role: Role;
}
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @Get('credentials')
  @Public()
  getCredentials() {
    const publicKey = process.env.STRIPE_PUBLIC_KEY;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!publicKey || !secretKey) {
      return ApiResponses.error('Stripe keys are not configured properly in .env file');
    }
    return ApiResponses.success({ publicKey, secretKey }, 'Stripe credentials fetched successfully');
  }
  @Patch('update-payment-data')
  @Auth()
  @ApiBearerAuth()
  @ApiBody({ type: UpdatePaymentDataDto })
  updatePaymentData(@Body() body: UpdatePaymentDataDto, @CurrentUser() user: IUser) {
    try {
      const userId = user.id;
      return this.stripeService.updatePaymentData(userId, body);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return ApiResponses.error(message);
    }
  }

  // create payment Intents
  @Post('add-funds')
  @Auth()
  @ApiBearerAuth()
  @ApiBody({ type: AddFundsDto })
  async addfound(@Body() body: AddFundsDto, @CurrentUser() user: IUser) {
    try {
      return await this.stripeService.createPaymentIntent(user.id, body);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return ApiResponses.error(message);
    }
  }



  @Post('create-express-account')
  @Auth()
  @ApiBearerAuth()
  async createConnectedAccount(@CurrentUser() user: IUser) {
    try {      
      const res = await this.stripeService.createConnectedAccount(user.id);
      return ApiResponses.success(res, "Account Connected success fully")
    } catch (error) {
      // const message = error instanceof Error ? error.message : 'Unknown error';
      return ApiResponses.error(error, "Account connection with stripe failed");
    }


  }


}
