import { Injectable } from "@nestjs/common";
import { CoinEvent } from "@prisma/client";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class LoginRewardService {
  constructor(private readonly prisma: PrismaService) {}

  async rewardDailyLogin(userId: number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Check if already rewarded today
    const alreadyRewarded = await this.prisma.coinHistory.findFirst({
      where: {
        userId,
        type:CoinEvent.DAILY_LOGIN ,
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
         where:{
              key:CoinEvent.DAILY_LOGIN
         }
    });

    await this.prisma.$transaction([
      // Insert coin history
      this.prisma.coinHistory.create({
        data: {
          userId,
          coin_acc_amount: DAILY_LOGIN_COINS?.coin_amount ?? 0,
          type: 'DAILY_LOGIN',
          role_triggered: 'SYSTEM',
          edited_by: 'SYSTEM',
        },
      }),

      // Update user balance
      this.prisma.user.update({
        where: { id: userId },
        data: {
          total_coin_acc: { increment: DAILY_LOGIN_COINS?.coin_amount },
          current_coin_balance :{increment:DAILY_LOGIN_COINS?.coin_amount}
        },
      }),
    ]);

    return {
      rewarded: true,
      coins: DAILY_LOGIN_COINS?.coin_amount,
    };
  }
}
