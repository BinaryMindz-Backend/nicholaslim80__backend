/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentType, WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import Stripe from 'stripe';
import { UserWalletQueryDto } from './dto/user-wallet.dto';
import { UserWalletHistoryQueryDto } from './dto/user-wallet-history-query.dto';

@Injectable()
export class WalletService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-12-15.clover',
    });
  }

  //
  // ---------- Add Money (Backend Test using Stripe token) ----------
  async addMoneyTest(userId: number, amount: number, testToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Step 1: Create Stripe Customer if not exist
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email ?? undefined,
        name: user.username ?? undefined,
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Step 2: Create a PaymentMethod from test token
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card: { token: testToken }, // e.g., 'tok_visa'
    });

    // Step 3: Attach PaymentMethod to Customer
    await this.stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId,
    });

    // Step 4: Optionally set as default
    await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethod.id },
    });

    // Step 5: Create PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethod.id,
      off_session: true,
      confirm: true,
    });

    // Step 6: Add wallet history
    await this.prisma.walletHistory.create({
      data: {
        userId,
        type: 'credit',
        amount,
        status: 'SUCCESS',
        transactionType: WalletTransactionType.PAYMENT,
        transactionId: paymentIntent.id,
      },
    });

    // Step 7: Update wallet balance
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalWalletBalance: { increment: amount },
        currentWalletBalance: { increment: amount },
      },
    });

    return {
      message: 'Wallet credited successfully',
      amount,
      paymentIntentId: paymentIntent.id,
    };
  }

  // ---------- Add Money ----------
  // async addMoney(
  //   userId: number,
  //   amount: number,
  //   paymentMethodId?: string,
  //   payType?: string,
  // ) {
  //   // console.log("strip-->",paymentMethodId,amount);
  //   // Fetch user
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //   });
  //   if (!user) throw new NotFoundException('User not found');
  //   if (!user.email) throw new BadRequestException('User email is not found');

  //   // Create Stripe Customer if not exist
  //   let customerId = user.stripeCustomerId;
  //   if (!customerId) {
  //     const customer = await this.stripe.customers.create({
  //       email: user.email,
  //       name: user.username ?? undefined,
  //     });
  //     customerId = customer.id;
  //     await this.prisma.user.update({
  //       where: { id: userId },
  //       data: { stripeCustomerId: customerId },
  //     });
  //   }

  //   // Determine payment method
  //   if (!paymentMethodId) {
  //     const defaultMethod = await this.prisma.paymentMethod.findFirst({
  //       where: { userId, isDefault: true },
  //     });
  //     if (!defaultMethod)
  //       throw new BadRequestException('No saved payment method found');
  //     paymentMethodId = defaultMethod.stripeMethodId;
  //   }

  //   // Create and confirm PaymentIntent
  //   const paymentIntent = await this.stripe.paymentIntents.create({
  //     amount: Math.round(amount * 100), // Stripe expects cents
  //     currency: 'usd', // adjust to your currency
  //     customer: customerId,
  //     payment_method: paymentMethodId,
  //     off_session: true,
  //     confirm: true,
  //   });

  //   if (payType === 'ADD_MONEY') {
  //     //  Record in wallet history
  //     await this.prisma.walletHistory.create({
  //       data: {
  //         userId,
  //         type: 'credit',
  //         amount,
  //         status: 'SUCCESS',
  //         transactionType: WalletTransactionType.PAYMENT,
  //         transactionId: paymentIntent.id,
  //       },
  //     });

  //     // Update wallet balance
  //     await this.prisma.user.update({
  //       where: { id: userId },
  //       data: {
  //         totalWalletBalance: { increment: amount },
  //         currentWalletBalance: { increment: amount },
  //       },
  //     });
  //   }

  //   return { message: 'Wallet credited successfully', amount };
  // }
  

  // 
  async addMoney(
    userId: number,
    amount: number,
    currency: string = 'sgd', // Default to SGD if not provided
    paymentMethodId?: string,
    payType?: string,
  ) {
      // Helper map for zero-decimal currencies
    const ZERO_DECIMAL_CURRENCIES = ['jpy', 'krw', 'vnd', 'clp'];
    const lowerCurrency = currency.toLowerCase();
    
    // Calculate Stripe Amount (Handle Zero-Decimal Currencies)
      let stripeAmount: number;
      
      if (ZERO_DECIMAL_CURRENCIES.includes(lowerCurrency)) {
        stripeAmount = Math.round(amount); // JPY 100 is just 100
      } else {
        stripeAmount = Math.round(amount * 100); // USD 10.50 becomes 1050 cents
      }
      
      //  Fetch User and Validate
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (!user.email) throw new BadRequestException('User email not found');
      // Handle Stripe Customer (Optimized check)
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: user.username ?? undefined,
        });
        customerId = customer.id;
        await this.prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });
      }

      // Resolve Payment Method
      if (!paymentMethodId) {
        const defaultMethod = await this.prisma.paymentMethod.findFirst({
          where: { userId, isDefault: true },
        });
        if (!defaultMethod) throw new BadRequestException('No saved payment method found');
        paymentMethodId = defaultMethod.stripeMethodId;
      }
      

      // 2. Create Payment Intent with Dynamic Currency
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: lowerCurrency, // Dynamic here
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          userId: userId.toString(),
          type: payType || PaymentType.ADD_MONEY,
          amount: amount.toString(),
          currency: lowerCurrency, // Store currency in metadata for Webhook
        },
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      });
    // ... (Transaction logic) ...
    if (payType === PaymentType.ADD_MONEY) {
      await this.prisma.walletHistory.create({
          data: {
            userId,
            type: 'credit',
            amount,
            currency: lowerCurrency, // Save to DB
            status: 'SUCCESS',
            transactionType: WalletTransactionType.PAYMENT,
            transactionId: paymentIntent.id,
          },
        });
        
        // NOTE: Updating User Balance with different currencies is tricky.
        // Usually, a wallet has a "Base Currency" (e.g., USD).
        // If the user pays in EUR, you might need to convert it before adding to balance.
        // For now, we assume 1 unit = 1 unit (Risky if mixing currencies!)
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            totalWalletBalance: { increment: amount },
            currentWalletBalance: { increment: amount },
          },
        });
    }

    return { message: 'Success', currency: lowerCurrency, amount };
  }

  // ---------- Add Money Mobile ----------

  // Create the Intent (Called by Flutter)
  async createIntent(userId: number, amount: number, currency = 'sgd') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Convert SGD to cents: $10.50 \times 100 = 1050$
    const stripeAmount = Math.round(amount * 100);

    const intent = await this.stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: currency,
      metadata: { userId: userId.toString(), amount: amount.toString() },
      automatic_payment_methods: { enabled: true },
    });

    return { clientSecret: intent.client_secret };
  }


  // payment status update by webhook
  async handleWebhook(rawBody: Buffer, signature: string){
     //  
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    }
    catch (err) {
       throw new BadRequestException(`Webhook Signature Error: ${err.message}`);
    }
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await this.fulfillPayment(intent);
        break;
      }
      // ... handle other event types
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        // Optional: Notify user of failure
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    // Return a response to acknowledge receipt of the event
    return { received: true };


  }

  // private methods for webhook handling
  private async fulfillPayment(intent: Stripe.PaymentIntent) {
    const userId = parseInt(intent.metadata.userId);
    const amount = parseFloat(intent.metadata.amount);
     
    // 
    if (intent.metadata.type !== 'ADD_MONEY' || !userId) return;
    // ATOMICITY: Update both or neither
    await this.prisma.$transaction(async (tx) => {
      // 1. Idempotency Check: Prevent duplicate processing
      const existing = await tx.walletHistory.findUnique({
        where: { transactionId: intent.id },
      });
      if (existing) return;

      // 2. Log History
      await tx.walletHistory.create({
        data: {
          userId,
          amount,
          transactionId: intent.id,
          transactionType: WalletTransactionType.PAYMENT, 
          status: WalletTransactionStatus.SUCCESS,
          type: 'credit',
        },
      });

      // 3. Update Balance
      await tx.user.update({
        where: { id: userId },
        data: { 
          totalWalletBalance: { increment: amount },
          currentWalletBalance: { increment: amount } },
      });
    });
    // 
  }


  //  save card info
  async createSetupIntent(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email ?? undefined,
        name: user.username ?? undefined,
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });
      user.stripeCustomerId = customer.id;
    }

    const intent = await this.stripe.setupIntents.create({
      customer: user.stripeCustomerId,
    });

    return { clientSecret: intent.client_secret };
  }
  //
  async saveCard(userId: number, paymentMethodId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) throw new Error('Stripe customer not found');

    // Attach payment method to customer
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // Optionally, set as default
    await this.stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Save in your DB
    return this.prisma.paymentMethod.create({
      data: {
        userId,
        stripeMethodId: paymentMethodId,
        isDefault: true, // or false
        type: 'CARD',
      },
    });
  }

  // pay with saved card
  async payWithSavedCard(
    userId: number,
    amount: number,
    paymentMethodId: string,
    payType?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId)
      throw new BadRequestException('Stripe customer not found');

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
    });
    //
    if (payType === 'ADD_MONEY') {
      //  Record in wallet history
      await this.prisma.walletHistory.create({
        data: {
          userId,
          type: 'credit',
          amount,
          status: 'SUCCESS',
          transactionType: WalletTransactionType.PAYMENT,
          transactionId: paymentIntent.id,
        },
      });

      // Update wallet balance
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          totalWalletBalance: { increment: amount },
          currentWalletBalance: { increment: amount },
        },
      });
    }

    return { amount, message: 'Wallet credited successfully' };
  }

  // get saved cards
  async getSavedCards(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) throw new NotFoundException('User not found');

    // Fetch saved cards from your DB
    const cards = await this.prisma.paymentMethod.findMany({
      where: { userId },
      select: { id: true, stripeMethodId: true, isDefault: true, type: true },
    });

    // Optional: fetch card details from Stripe for display
    const cardDetails = await Promise.all(
      cards.map(async (c) => {
        const paymentMethod = await this.stripe.paymentMethods.retrieve(
          c.stripeMethodId,
        );
        return {
          id: c.id,
          stripeMethodId: c.stripeMethodId,
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          exp_month: paymentMethod.card?.exp_month,
          exp_year: paymentMethod.card?.exp_year,
          isDefault: c.isDefault,
        };
      }),
    );

    return cardDetails;
  }
  //
  async deleteCard(userId: number, cardId: number) {
    // Fetch DB record
    const card = await this.prisma.paymentMethod.findUnique({
      where: { id: cardId },
    });

    if (!card || card.userId !== userId) {
      throw new NotFoundException('Card not found');
    }

    // Detach card from Stripe customer
    await this.stripe.paymentMethods.detach(card.stripeMethodId);

    // Delete from DB
    await this.prisma.paymentMethod.delete({
      where: { id: cardId },
    });

    return { message: 'Card deleted successfully' };
  }

  // ---------- Withdraw ----------
  async withdraw(userId: number, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.totalWalletBalance < amount)
      throw new BadRequestException('Insufficient balance');

    if (!user.stripeAccountId)
      throw new BadRequestException(
        'User does not have a connected Stripe account',
      );

    // Transfer from your platform (admin) to user's Stripe connected account
    await this.stripe.transfers.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      destination: user.stripeAccountId,
    });

    // Update wallet and history
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentWalletBalance: { decrement: amount } },
    });

    await this.prisma.walletHistory.create({
      data: {
        userId,
        type: 'debit',
        amount,
        status: WalletTransactionStatus.SUCCESS,
        transactionType: WalletTransactionType.PAYOUT,
        transactionId: 'demo',
      },
    });

    return { message: 'Withdrawal successful', amount };
  }

  // user wallet with search and pagination
  async userWallet(dto: UserWalletQueryDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 10;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = { role: { name: dto.role } };

    if (dto.search) {
      where.OR = [
        { username: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
        { phone: { contains: dto.search, mode: 'insensitive' } },
        // { id: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          username: true,
          email: true,
          totalWalletBalance: true,
          currentWalletBalance: true,
        },
      }),
    ]);
    //
    return {
      total,
      page,
      limit,
      data,
    };
  }

  // user wallet history with filter and pagination
  async userWalletHistory(userId: number, dto: UserWalletHistoryQueryDto) {
    // default values
    const page = dto.page || 1;
    const limit = dto.limit || 10;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = { userId };

    if (dto.type) {
      where.transactionType = dto.type;
    }

    const [total, data] = await Promise.all([
      this.prisma.walletHistory.count({ where }),
      this.prisma.walletHistory.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }, // latest first
      }),
    ]);

    return {
      total,
      page,
      limit,
      data,
    };
  }
  //
  async delete(id: number) {
    const record = await this.prisma.walletHistory.findUnique({
      where: {
        id,
      },
    });
    if (!record) {
      throw new NotFoundException('Record Not Found');
    }

    await this.prisma.walletHistory.delete({
      where: {
        id,
      },
    });
  }
}
