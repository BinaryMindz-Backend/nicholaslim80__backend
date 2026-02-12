/* eslint-disable @typescript-eslint/no-unsafe-return */
import { UserGateway } from 'src/modules/users_root/users/user.gateways';
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, PaymentType, PayType, TransactionStatus, TransactionType, WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import Stripe from 'stripe';
import { UserWalletQueryDto } from './dto/user-wallet.dto';
import { UserWalletHistoryQueryDto } from './dto/user-wallet-history-query.dto';
import { RaiderGateway } from 'src/modules/raider_root/raider gateways/raider.gateway';
import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';


@Injectable()
export class WalletService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private raiderGateway: RaiderGateway,
    private readonly userGateway: UserGateway,
    private readonly emailQueueService: EmailQueueService,
  ) {
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
  async createIntent(userId: number, amount: number, currency = 'sgd', orderId?: number, payType?: string, type?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Convert SGD to cents: $10.50 \times 100 = 1050$
    const stripeAmount = Math.round(amount * 100);
    //  
    const intent = await this.stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: currency,
      metadata: {
        userId: userId.toString(),
        amount: amount.toString(),
        orderId: orderId?.toString() ?? "",
        payType: payType ?? null,
        type: type ?? null
      },
      automatic_payment_methods: { enabled: true },
    });

    return { clientSecret: intent.client_secret, orderId };
  }


  // payment status update by webhoo
  async handleWebhook(rawBody: Buffer, signature: string) {
    console.log("=== WEBHOOK HANDLER DEBUG ===");
    console.log("1. Signature:", signature?.substring(0, 20) + '...');
    console.log("2. Raw Body Type:", typeof rawBody);
    console.log("3. Raw Body is Buffer?", Buffer.isBuffer(rawBody));
    console.log("4. Raw Body length:", rawBody?.length || 0);
    console.log("5. Webhook Secret exists?", !!process.env.STRIPE_WEBHOOK_SECRET);

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET not configured in environment');
    }

    let event: Stripe.Event;

    try {
      // Stripe's constructEvent expects a Buffer or string
      // When using express.raw(), request.body is already a Buffer
      console.log("6. Constructing event with Stripe...");

      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );

      console.log("7. ✅ Event constructed successfully!");
      console.log("8. Event Type:", event.type);
      console.log("9. Event ID:", event.id);
    } catch (err) {
      console.error("❌ Webhook Signature Verification Failed!");
      console.error("Error Type:", err.type);
      console.error("Error Message:", err.message);
      console.error("Error Details:", err);

      // Log additional debug info
      console.error("Debug Info:");
      console.error("- Signature length:", signature?.length);
      console.error("- Body length:", rawBody?.length);
      console.error("- Secret length:", process.env.STRIPE_WEBHOOK_SECRET?.length);

      throw new BadRequestException(`Webhook Signature Error: ${err.message}`);
    }

    console.log("=== PROCESSING EVENT ===");
    console.log("Event Type:", event.type);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        console.log("💰 Processing successful payment...");
        const intent = event.data.object as Stripe.PaymentIntent;

        console.log("Payment Details:");
        console.log("- ID:", intent.id);
        console.log("- Amount:", intent.amount / 100, intent?.currency?.toUpperCase());
        console.log("- Status:", intent.status);
        console.log("- Metadata:", JSON.stringify(intent.metadata, null, 2));
        // Call fulfillment logic
        try {
          await this.fulfillPayment(intent);
          console.log("✅ Payment fulfilled successfully!");
        } catch (error) {
          console.error("❌ Error fulfilling payment:", error);
          throw error;
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        console.log('❌ Payment failed:', event.data.object.id);
        const intent = event.data.object as Stripe.PaymentIntent;
        console.log("Failed payment details:", {
          id: intent.id,
          amount: Number(intent.metadata.amount) / 100,
          currency: intent.metadata.currency,
          last_payment_error: intent.last_payment_error,
        });
        if (intent.last_payment_error) {
          console.error("Payment error details:", intent.last_payment_error);
          const userId = parseInt(intent.metadata.userId);
          const paymentType = intent.metadata.type as PaymentType;
          const orderId = parseInt(intent.metadata.orderId) || 0;
          //add wallet history for failed payment
          if (paymentType === PaymentType.ADD_MONEY) {
            const r = await this.prisma.walletHistory.findFirst({
              where: { transactionId: `TX-${intent.id}` },
            });
            if (!r) {
              console.log("Failed to find transaction for webhook event:", intent.id);
            }
            // 
            await this.prisma.walletHistory.create({
              data: {
                userId,
                type: 'credit',
                amount: parseFloat(intent.metadata.amount),
                currency: intent.metadata.currency,
                status: WalletTransactionStatus.FAILED,
                transactionType: WalletTransactionType.PAYMENT,
                transactionId: `TX-${intent.id}`,
              },
            });
            // notify user about failed payment
            await this.userGateway.notifyAddMoneyFailed(
              userId,
              `Your add money of ${Number(intent.metadata.amount) / 100} ${intent.metadata?.currency?.toUpperCase()} failed. Please try again.`
            );
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            // notify user by push notification
            await this.emailQueueService.queuePushNotification({
              userId,
              fcmToken: user?.fcmToken || '',
              title: "Add Money Failed",
              body: `Your add money of ${Number(intent.metadata.amount) / 100} ${intent.metadata?.currency?.toUpperCase()} failed. Please try again.`,
            });
          }


          // 
          else if (paymentType === PaymentType.PAYMENT) {
            const r = await this.prisma.transaction.findFirst({
              where: { transaction_code: `TX-${intent.id}` },
            });
            if (!r) {
              console.log("Failed to find transaction for webhook event:", intent.id);
            }
            // Record failed transaction in DB
            await this.prisma.transaction.create({
              data: {
                userId,
                orderId: orderId,
                payment_method_id: null,
                payment_status: PaymentStatus.FAILED,
                type: TransactionType.BOOK_ORDER,
                pay_type: intent.metadata.payType,
                tx_status: TransactionStatus.FAILED,
                transaction_code: `TX-${intent.id}`,
              }
            })
            // notify user about failed payment
            await this.userGateway.notifyPaymentFailed(
              userId,
              orderId,
              `Your payment of ${Number(intent.metadata.amount) / 100} ${intent.metadata?.currency?.toUpperCase()} failed. Please try again.`
            );
            // 
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            // notify user by push notification
            await this.emailQueueService.queuePushNotification({
              userId,
              fcmToken: user?.fcmToken || '',
              title: "Order Payment Failed",
              body: `Your order payment of ${Number(intent.metadata?.amount) / 100} ${intent.metadata?.currency?.toUpperCase()} failed. Please try again.`,
            });
          }
        }
        break;
      }

      case 'payment_intent.created': {
        console.log('📝 Payment intent created:', event.data.object.id);
        // You can add additional logging or processing here if needed
        console.log('💵 Payment intent amount capturable updated:', event.data.object.id);
        const intent = event.data.object as Stripe.PaymentIntent;
        const userId = parseInt(intent.metadata.userId);
        const orderId = parseInt(intent.metadata.orderId);
        //  
        if (!orderId) return;
        if (intent.metadata.type === PaymentType.PAYMENT) {
          // Fetch order details first
          const order = await this.prisma.order.findUnique({
            where: { id: orderId },
          });
          if (!order) return;
          // Record successful transaction in DB
          await this.prisma.transaction.create({
            data: {
              userId,
              orderId: orderId,
              total_fee: order.total_cost,
              redeemed_coin: order.coinsRedeemed,
              additional_fee: order.additional_cost,
              delivery_fee: order.total_fee,
              payment_status: PaymentStatus.UNPAID,
              type: TransactionType.BOOK_ORDER,
              pay_type: intent.metadata.payType,
              tx_status: TransactionStatus.PENDING,
              transaction_code: `TX-${intent.id}`,
            }
          })

          break;

        }

        break;
      }
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        break;
    }

    console.log("=== WEBHOOK PROCESSING COMPLETE ===");

    // Return a response to acknowledge receipt of the event
    return { received: true };
  }


  // private methods for webhook handling
  private async fulfillPayment(intent: Stripe.PaymentIntent) {
    const userId = parseInt(intent.metadata.userId);
    const paymentType = intent.metadata.type as PaymentType;
    // 
    if (!userId) return;
    // 
    switch (paymentType) {
      case PaymentType.ADD_MONEY:
        await this.addMoneUpdateByWebHook(intent);
        break;
      case PaymentType.PAYMENT:
        await this.processOrderPayment(intent);
        break;

      default:
        console.log("Unhandled payment type", paymentType);
    }
  }

  //  add money by webhook
  private async addMoneUpdateByWebHook(intent: Stripe.PaymentIntent) {
    const amount = parseFloat(intent.metadata.amount);
    const userId = parseInt(intent.metadata.userId);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    // ADD_MONEY: Credit user's wallet
    await this.prisma.$transaction(async (tx) => {
      // 3. Update Balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          totalWalletBalance: { increment: amount },
          currentWalletBalance: { increment: amount },
        },
      });

      // 1. Idempotency Check: Prevent duplicate processing
      const existing = await tx.walletHistory.findUnique({
        where: { transactionId: `TX-${intent.id}` },
      });
      if (existing) return;

      // 2. Log History
      await tx.walletHistory.create({
        data: {
          userId,
          amount,
          transactionId: `TX-${intent.id}`,
          transactionType: WalletTransactionType.PAYMENT,
          status: WalletTransactionStatus.SUCCESS,
          type: 'credit',
        },
      });
      // 4. Notify User
      if (updatedUser) {
        await this.userGateway.notifyAddMoney(
          userId,
          `Your wallet has been credited with ${amount} ${intent.metadata.currency?.toUpperCase()} successfully!`
        );
        // notify user by push notification
        await this.emailQueueService.queuePushNotification({
          userId,
          fcmToken: user?.fcmToken || '',
          title: "Add Money Successful",
          body: `Your add money of ${amount} ${intent.metadata.currency?.toUpperCase()} was successful.`,
        });
      }
    });

    return;
  }
  //  porocess order payment by webhook
  private async processOrderPayment(intent: Stripe.PaymentIntent) {
    const payType = intent.metadata.payType as PayType;
    const userId = parseInt(intent.metadata.userId);
    const orderId = parseInt(intent.metadata.orderId);
    //  
    if (!orderId) return;
    // Fetch order details first
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            fcmToken: true
          }
        },
        vehicle: {
          select: {
            vehicle_type: true,
            id: true
          }
        },
        orderStops: {
          include: {
            destination: true,
            payment: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!order) return;

    // Process order placement
    const placeRes = await this.prisma.$transaction(async (tx) => {
      /** ----------------------- UPFRONT PAYMENT ----------------------- */
      if (payType === PayType.ONLINE_PAY) {
        await tx.stopPayment.updateMany({
          where: { orderStopId: { in: order.orderStops.map((s) => s.id) } },
          data: {
            payType: PayType.ONLINE_PAY,
            status: PaymentStatus.PAID,
            amount: 0,
          },
        });
      }

      /** ----------------------- UPDATE ORDER ----------------------- */
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          order_status: OrderStatus.PENDING,
          is_placed: true,
          pay_type: payType,
        },
        include: {
          orderStops: {
            include: {
              destination: true,
              payment: true,
            },
            orderBy: { sequence: 'asc' },
          },
        },
      });

      /** ----------------------- NOTIFY FAVORITE RAIDERS ----------------------- */
      if (order.notify_favorite_raider === true) {
        const favRaiders = await tx.myRaider.findMany({
          where: {
            user_id: userId,
            is_fav: true,
          },
          select: {
            raiderId: true,
            user_id: true,
            is_fav: true,
            user: {
              select: {
                username: true,
                id: true,
                email: true,
              },
            },
          },
        });

        // Send notification to favorite raiders
        if (favRaiders.length > 0) {
          for (const rider of favRaiders) {
            await this.raiderGateway.notifyUserFavRaider(
              rider.raiderId,
              orderId,
              rider.user.username!,
              {
                orderId: order.id,
                totalOrderCost: String(order.total_cost),
                totalFee: String(order.total_fee),
                vehicleType: order.vehicle!,
                deliveryType: order.delivery_type,
                orderStop: order.orderStops,
              }
            );
          }
        }
      }

      // 4. Notify User
      if (updatedOrder) {
        // create transaction record
        await this.prisma.transaction.create({
          data: {
            userId,
            orderId: orderId,
            total_fee: order.total_cost,
            redeemed_coin: order.coinsRedeemed,
            additional_fee: order.additional_cost,
            delivery_fee: order.total_fee,
            payment_status: PaymentStatus.PAID,
            type: TransactionType.BOOK_ORDER,
            pay_type: intent.metadata.payType,
            tx_status: TransactionStatus.COMPLETED,
            transaction_code: `TX-${intent.id}`,
          }
        })

        // notify user about successful payment 
        await this.userGateway.notifyPaymentSuccess(
          userId,
          orderId,
          `Your order #${orderId} has been placed for ${Number(intent.metadata.amount) / 100} ${intent.metadata?.currency?.toUpperCase()} successfully!`
        );

        // notify user by push notification
        await this.emailQueueService.queuePushNotification({
          userId,
          fcmToken: order.user?.fcmToken || '',
          title: "Order Placed Successfully",
          body: `Your order #${orderId} of ${Number(intent.metadata.amount) / 100} ${intent.metadata?.currency?.toUpperCase()} was placed successfully.`,
        });
      }

      return updatedOrder;
    });
    //  console.log(placeRes);
    return placeRes;
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


  // add money for order priority
  async addMoneyForOrderPriority(userId: number, amount: number, currency: string = 'sgd') {
    const result = await this.prisma.addMoneyForOrderPriority.create({
      data: {
        userId, amount, currency
      }
    });
    if (!result) {
      throw new BadRequestException('Failed to add money for order priority');
    }
    // 
    return result;
  }
  // 
  async getAddMoneyForOrderPriority(userId: number) {
    const record = await this.prisma.addMoneyForOrderPriority.findMany({
      where: { userId },
    });
    if (!record || record.length === 0) {
      throw new NotFoundException('No priority record found');
    }
    return record;
  }


  // ---------- Withdraw ----------
  async withdraw(userId: number, amount: number, currency: string) {
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

      const account = await this.stripe.accounts.retrieve(user.stripeAccountId);

      if(!account){
          throw new NotFoundException("Connected account not found")
      }

    // Transfer from your platform (admin) to user's Stripe connected account
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'sgd',
        destination: user.stripeAccountId,
        metadata: { userId: user.id.toString() },
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
        transactionId: transfer.id,
        currency: currency,
      },
    });

   return { message: 'Withdrawal requested', transferId: transfer.id };
  }

  // 
 
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
