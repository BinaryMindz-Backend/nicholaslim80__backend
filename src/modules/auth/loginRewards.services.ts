import { Injectable, Logger } from "@nestjs/common";
import { CoinEvent } from "@prisma/client";
import { PrismaService } from "src/core/database/prisma.service";
import { EmailQueueService } from "../queue/services/email-queue.service";

@Injectable()
export class LoginRewardService {
    private readonly logger = new Logger(LoginRewardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueueService: EmailQueueService
  ) {}

async rewardDailyLogin(userId: number) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Check if already rewarded today
  const alreadyRewarded = await this.prisma.coinHistory.findFirst({
    where: {
      userId,
      type: CoinEvent.DAILY_LOGIN,
      created_at: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  if (alreadyRewarded) {
    return { rewarded: false };
  }

  const DAILY_LOGIN_COINS = await this.prisma.coin.findFirst({
    where: { key: CoinEvent.DAILY_LOGIN },
  });

  const rewardAmount = Number(DAILY_LOGIN_COINS?.coin_amount) || 0;

  // Perform transaction: add coin history & update user balance
  await this.prisma.$transaction([
    this.prisma.coinHistory.create({
      data: {
        userId,
        coin_acc_amount: rewardAmount,
        type: CoinEvent.DAILY_LOGIN,
        role_triggered: 'SYSTEM',
        edited_by: 'SYSTEM',
        created_at: new Date(),
      },
    }),
    this.prisma.user.update({
      where: { id: userId },
      data: {
        total_coin_acc: { increment: rewardAmount } as any,
        current_coin_balance: { increment: rewardAmount } as any,
      },
    }),
  ]);

  // --- Send push notification ---
  try {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.fcmToken && DAILY_LOGIN_COINS?.coin_amount) {
      await this.emailQueueService.queuePushNotification({
        userId,
        fcmToken: user.fcmToken,
        title: 'Daily Login Reward!',
        body: `You received ${rewardAmount} coins for logging in today!`,
      });
    }
  } catch (err) {
    this.logger.error(`Failed to send daily login notification to user ${userId}:`, err);
  }

  return {
    rewarded: true,
    coins: rewardAmount,
  };
}

}
