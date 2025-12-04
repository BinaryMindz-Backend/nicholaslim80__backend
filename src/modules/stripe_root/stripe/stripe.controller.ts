import { Controller, Get, Post, Body, Patch, Param, Delete, } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { UpdateStripeDto } from './dto/update-stripe.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdatePaymentDataDto } from './dto/update-payment-data.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { Auth } from 'src/decorators/auth.decorator';
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




  @Post()
  create(@Body() createStripeDto: CreateStripeDto) {
    return this.stripeService.create(createStripeDto);
  }

  @Get()
  findAll() {
    return this.stripeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stripeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStripeDto: UpdateStripeDto) {
    return this.stripeService.update(+id, updateStripeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stripeService.remove(+id);
  }
}
