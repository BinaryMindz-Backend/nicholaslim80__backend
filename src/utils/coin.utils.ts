import { PrismaService } from 'src/core/database/prisma.service';
import {BadRequestException, NotAcceptableException } from '@nestjs/common';
import { CoinEvent, CoinHistoryType } from '@prisma/client';

export class CoinUtils {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Earn coins for a user
   * @param user - user object
   * @param coinAmount - number of coins to add
   * @param event - CoinEvent enum value
   */
  async earnCoin(userId:number, coinAmount: number, event: CoinEvent) {
    if (coinAmount <= 0) throw new BadRequestException('Coin amount must be positive');
    const coin = await this.prisma.coin.findFirst({
           where:{
              key:event
           }
    }) 
    if(!coin){
          throw new NotAcceptableException("Coin key not found")
    }
    // 
    const baseCoin = await this.prisma.coin.aggregate({
      _avg: { coin_value_in_cent: true },
    });
    const basePrice = Number(baseCoin._avg.coin_value_in_cent ?? 0);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { total_coin_acc: { increment: coinAmount } ,current_coin_balance: { increment: coinAmount } },
    });

    await this.prisma.coinHistory.create({
      data: {
        userId: userId,
        role_triggered: event,
        coin_acc_amount: coinAmount,
        type: CoinHistoryType.ACCUMULATION,
        edited_by: 'SYSTEM',
      },
    });

    return {
      updatedUser,
      earnedAmountInCent: coinAmount * basePrice,
    };
  }


//   
  }
