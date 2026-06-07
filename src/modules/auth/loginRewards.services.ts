import { Injectable, Logger } from "@nestjs/common";
import { CoinEvent, UserRole } from "@prisma/client";
import { PrismaService } from "src/core/database/prisma.service";
import { EmailQueueService } from "../queue/services/email-queue.service";
import { CoinUtils } from "src/utils/coin.utils";

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
      // not for driver and admin
      const role = await this.prisma.role.findFirst({
          where:{
              users:{
                  some:{
                     id:userId
                  }
              }
          }
      })
      if(!role?.isStatic || !(role.name=== UserRole.USER)) return;

      const alreadyRewarded = await this.prisma.coinHistory.findFirst({
      where: {
        userId,
        role_triggered: CoinEvent.DAILY_LOGIN,
        created_at: { gte: startOfDay, lte: endOfDay },
      },
      });

      if (alreadyRewarded) return { rewarded: false };

      const dailyCoin = await this.prisma.coin.findFirst({
      where: { key: CoinEvent.DAILY_LOGIN, is_active: true },
      });

      const rewardAmount = Number(dailyCoin?.coin_amount ?? 0);
      if (rewardAmount === 0) return { rewarded: false };

      const coinUtils = new CoinUtils(this.prisma);
      await coinUtils.earnCoin(userId, rewardAmount, CoinEvent.DAILY_LOGIN);

      // ── Push notification ──
      try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.fcmToken) {
        await this.emailQueueService.queuePushNotification({
          userId,
          fcmToken: user.fcmToken,
          type: "COIN_CREDITED",
          title: 'Daily Login Reward!',
          body:  `You received ${rewardAmount} coins for logging in today!`,
        });
      }
      } catch (err) {
      this.logger.error(`Push notification failed for user ${userId}:`, err);
      }

      return { rewarded: true, coins: rewardAmount };
  }

}
