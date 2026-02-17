import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { CreateTipDto } from "./dto/create-tip.dto";
import { OrderStatus, PaymentStatus, PayType, TransactionStatus, TransactionType, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import { WalletService } from "src/common/wallet/wallet.service";
import { EmailQueueService } from "src/modules/queue/services/email-queue.service";

@Injectable()
export class TipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly emailQueueService: EmailQueueService,
  ) { }

  //  
  async createTip(userId: number, dto: CreateTipDto, orderId: number) {
    // Wrap everything in transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate order
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          userId: true,
          order_status: true,
          assign_rider_id: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.userId !== userId) {
        throw new BadRequestException('Unauthorized - Not your order');
      }

      if (order.order_status !== OrderStatus.COMPLETED) {
        throw new BadRequestException('Can only tip completed orders');
      }

      if (!order.assign_rider_id) {
        throw new BadRequestException('No raider assigned to this order');
      }

      // 2. Validate amount
      if (!dto.amount || dto.amount <= 0) {
        throw new BadRequestException('Tip amount must be greater than 0');
      }

      // 3. Check if already tipped
      const existingTip = await tx.tip.findFirst({
        where: { orderId, userId },
      });

      if (existingTip) {
        throw new BadRequestException('You have already tipped this order');
      }

      // 4. Handle payment
      if (dto.paymentMethod === PayType.WALLET) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { currentWalletBalance: true },
        });

        if (!user || Number(user.currentWalletBalance) < Number(dto.amount)) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        // Deduct from user wallet
        await tx.user.update({
          where: { id: userId },
          data: {
            currentWalletBalance: { decrement: Number(dto.amount) },
          },
        });
      }

      if (dto.paymentMethod === PayType.ONLINE_PAY) {
        if (!dto.paymentMethodId) {
          throw new BadRequestException('Payment method ID required');
        }

        const paid = await this.walletService.addMoney(
          userId,
          Number(dto.amount),
          dto.paymentMethodId,
        );

        if (!paid) {
          throw new BadRequestException('Online payment failed');
        }
      }

      // 5. Create tip record
      const tip = await tx.tip.create({
        data: {
          amount: Number(dto.amount),
          userId,
          raiderId: order.assign_rider_id,
          orderId
        },
        include: {
          user: {
            select: {
              id: true,
              fcmToken: true,
              username: true,
            },
          },
          raider: {
            include: {
              user: {
                select: {
                  id: true,
                  fcmToken: true,
                  username: true,
                },
              },
            },
          },
        },
      });
      //  
      const raiderUser = await tx.raider.findUnique({
        where: { id: order.assign_rider_id },
      });

      if (!raiderUser) {
        throw new NotFoundException('Raider not found');
      }
      // 6. Credit raider wallet
      const raider = await tx.user.update({
        where: {
          id: raiderUser.userId
        },
        data: {
          totalWalletBalance: { increment: Number(dto.amount) },
          currentWalletBalance: { increment: Number(dto.amount) },
        },
        select: {
          id: true,
          currentWalletBalance: true,
          totalWalletBalance: true,
        },
      });
      //
      await tx.walletHistory.create({
        data: {
          userId: raider.id,
          amount: Number(dto.amount),
          type: 'credit',
          transactionId: `TRX-tip-${orderId}`,
          transactionType: WalletTransactionType.EARNING,
          status: WalletTransactionStatus.SUCCESS,
          currency: 'SGD',
        },
      });

      // 7. Create transaction record
      const txCode = `TIP-${orderId}-${Date.now()}`;
      await tx.transaction.create({
        data: {
          transaction_code: txCode,
          type: TransactionType.TIP,
          payment_status: PaymentStatus.PAID,
          tx_status: TransactionStatus.COMPLETED,
          total_fee: Number(dto.amount),
          delivery_fee: Number(dto.amount),
          userId,
          orderId,
          pay_type: dto.paymentMethod,
        },
      });

      // 8. Send notifications (outside transaction - async)
      setImmediate(async () => {
        try {
          // Notify raider
          if (tip.raider?.user?.fcmToken) {
            await this.emailQueueService.queuePushNotification({
              userId: tip.raider.user.id,
              fcmToken: tip.raider.user.fcmToken,
              title: '🎉 You received a tip!',
              body: `${tip.user.username} tipped you ৳${dto.amount} for order #${orderId}`,
            });
            console.log(`📱 Tip notification sent to raider ${tip.raider.user.id}`);
          }

          // Notify user (confirmation)
          if (tip.user?.fcmToken) {
            await this.emailQueueService.queuePushNotification({
              userId: tip.user.id,
              fcmToken: tip.user.fcmToken,
              title: '✅ Tip sent successfully',
              body: `You tipped ${tip.raider.user.username} ৳${dto.amount}`,
            });
            console.log(`📱 Tip confirmation sent to user ${tip.user.id}`);
          }
        } catch (error) {
          console.error('Failed to send tip notifications:', error);
        }
      });

      return {
        success: true,
        tip: {
          id: tip.id,
          amount: tip.amount,
          orderId: tip.orderId,
          raiderName: tip.raider.user.username,
        },
        raider: {
          newBalance: raider.currentWalletBalance,
          totalEarnings: raider.totalWalletBalance,
        },
      };
    });
  }

  // Get tips for an order
  async getOrderTips(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, assign_rider_id: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only order owner or raider can view tips
    if (order.userId !== userId && order.assign_rider_id !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const tips = await this.prisma.tip.findMany({
      where: { orderId },
      include: {
        user: {
          select: { id: true, username: true },
        },
      }
    });

    const totalTips = tips.reduce((sum, tip) => sum + Number(tip.amount), 0);

    return {
      tips,
      totalTips,
      count: tips.length,
    };
  }

  // Get raider's total tips
  async getRaiderTips(raiderId: number) {


    const raider = await this.prisma.raider.findUnique({
      where: { userId: raiderId },
    });

    if (!raider) {
      throw new BadRequestException('Not a raider');
    }


    const [tips, stats] = await Promise.all([

      this.prisma.tip.findMany({
        where: { raiderId: raider.id },
        include: {
          user: { select: { username: true } },
          order: { select: { id: true } },
        },
        take: 50, // Last 50 tips
      }),

      this.prisma.tip.aggregate({
        where: { raiderId },
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
      }),
    ]);

    return {
      tips,
      totalTips: stats._sum.amount || 0,
      totalCount: stats._count || 0,
      averageTip: stats._avg.amount || 0,
    };
  }

  async findAll() {
    return this.prisma.tip.findMany({
      include: {
        raider: true,
        user: true,
        order: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.tip.findUnique({
      where: { id },
      include: {
        raider: true,
        user: true,
        order: true,
      },
    });
  }

}
