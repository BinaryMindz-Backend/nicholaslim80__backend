import { Inject, Injectable } from '@nestjs/common';
import { UpdatePaymentDataDto } from './dto/update-payment-data.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ApiResponses } from 'src/common/apiResponse';
import Stripe from 'stripe';
import { AddFundsDto } from './dto/add-funds.dto';
@Injectable()
export class StripeService {
  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    private readonly prisma: PrismaService
  ) { }
  async updatePaymentData(userid: number, dto: UpdatePaymentDataDto) {
    const userExist = await this.prisma.user.findUnique({
      where: { id: userid },
    });

    if (!userExist) {
      return ApiResponses.error('User not found');
    }
    const dataUpdate = await this.prisma.user.update({
      where: { id: userid },
      data: {
        stripe_customer_id: dto.customerId,
        stripe_payment_method_id: dto.paymentMethodId,
      },
    });
    return {
      message: `Payment data for user ${userid} with customer ID ${dto.customerId} updated successfully with payment method ${dto.paymentMethodId}`,
      data: dataUpdate,
    };
  }

  async createPaymentIntent(userId: number, dto: AddFundsDto) {
    const userExist = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExist) {
      return ApiResponses.error('User not found');
    }

    if (!userExist.stripe_customer_id || !userExist.stripe_payment_method_id) {
      return ApiResponses.error('Stripe customer ID or payment method ID not found for user');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: dto.amount,
      currency: 'usd',
      metadata: { userId },
      payment_method_types: ['card'],
      customer: userExist.stripe_customer_id,
      payment_method: userExist.stripe_payment_method_id,
      confirm: true,
    });
    if (paymentIntent?.status === 'succeeded') {
      const payableAmount = ((dto.amount / 100) - ((dto.amount / 100) * 0.035))
      const walletUpdate = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          stripe_balance: userExist.stripe_balance + payableAmount,
        }
      })
      return {
        message: 'Payment Intent created successfully and funds added to wallet',
        walletUpdate
      };
    }

    return ApiResponses.error('Payment failed');
  }






}
