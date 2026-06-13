import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCoinManagementDto } from './dto/update-coin_management.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ApiResponses } from 'src/common/apiResponse';
import { IUser } from 'src/types';
import { CreateCoinDto } from './dto/create-coin_management.dto';
import { CoinHistoryType, UserRole, WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';
import { DateByFilterDto } from '../customer_order_confirmation/dto/date-filter.dto';
import { GiftCoinsDto } from './dto/gift_coin.dto';
import { TransactionIdService } from 'src/common/services/transaction-id.service';

@Injectable()
export class CoinManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueueService: EmailQueueService,
    private readonly txIdService:TransactionIdService
  ) { }

  // 
  async create(
    createCoinDto: CreateCoinDto,
    changedByRole :string,
    changedByUserId: number,
  ) {
    const dataExist = await this.prisma.coin.findFirst({
      where: {
        key: createCoinDto.key,
      },
    });

    if (dataExist) {
      return ApiResponses.error('This Event Coin data already exist');
    }

    const data = await this.prisma.coin.create({
      data: createCoinDto,
    });

    await this.prisma.coinLog.create({
      data: {
        coinId: data.id,
        key: data.key,
        description: data.description,
        coinAmount: data.coin_amount,
        condition: data.condition!,
        expireDays: data.expire_days,
        coinValueInCent: data.coin_value_in_cent,
        isActive: data.is_active,
        changedByRole,
        changedByUserId,
      },
    });

    return data;
  }


  // 
  async findAll() {
    const data = await this.prisma.coin.findMany()
    return data
  }

  // 
  async findAllCoinAcc(search?: { userId?: number; username?: string }) {
    const { userId, username } = search || {};

    const data = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            name: UserRole.USER,
          },
        },
        total_coin_acc: {
          gt: 0
        },
        ...(userId && { id: userId }),
        ...(username && {
          username: {
            contains: username,
            mode: 'insensitive',
          },
        }),
      },
      select: {
        id: true,
        username: true,
        total_coin_acc: true,
        current_coin_balance: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return data;
  }


  // 
  async update(
    id: number,
    updateCoinManagementDto: UpdateCoinManagementDto,
    changedByRole :string,
    changedByUserId: number,
  ) {
    const existData = await this.prisma.coin.findUnique({
      where: { id },
    });

    if (!existData) {
      return ApiResponses.error('Your Coin data not found');
    }

    const updated = await this.prisma.coin.update({
      where: { id },
      data: updateCoinManagementDto,
    });

    await this.prisma.coinLog.create({
      data: {
        coinId: updated.id,
        key: updated.key,
        description: updated.description,
        coinAmount: updated.coin_amount,
        condition: updated.condition!,
        expireDays: updated.expire_days,
        coinValueInCent: updated.coin_value_in_cent,
        isActive: updated.is_active,
        changedByRole,
        changedByUserId,
      },
    });

    return updated;
  }


  async remove(
        id: number,
        changedByRole :string,
        changedByUserId: number,
  ) {
    const exitData = await this.prisma.coin.findFirst({
      where: {
        id
      }
    })
    if (!exitData) {
      return ApiResponses.error("Your Coin data not found")
    }
    
    
    await this.prisma.coinLog.create({
      data: {
        coinId: exitData.id,
        key: exitData.key,
        description: exitData.description,
        coinAmount: exitData.coin_amount,
        condition: exitData.condition!,
        expireDays: exitData.expire_days,
        coinValueInCent: exitData.coin_value_in_cent,
        isActive: exitData.is_active,
        changedByRole,
        changedByUserId,
      },
    });
    return await this.prisma.coin.delete({
      where: {
        id
      }
    })
  }

  //  redeem coin
  async redeemCoin(user: IUser, coinAmount: number) {
    return this.prisma.$transaction(async (tx) => {
    const userRecord = await tx.user.findUnique({
      where: { id: user.id },
    });

    if (!userRecord) throw new NotFoundException('User not found');

    if ((userRecord.current_coin_balance ?? 0) < coinAmount) {
      throw new BadRequestException('Insufficient coin balance');
    }

    //  get value
    const baseCoin = await tx.coin.aggregate({
      _avg: { coin_value_in_cent: true },
    });

    const basePrice = Number(baseCoin._avg.coin_value_in_cent ?? 0);
    const totalValue = (coinAmount * basePrice)/ 100; // convert cents to dollars
    // deduct and update safely
    await tx.user.update({
      where: { id: user.id },
      data: {
        current_coin_balance: { decrement: coinAmount },
        totalWalletBalance: { increment: totalValue },
        currentWalletBalance:{increment: totalValue},
      },
    });

      await tx.coinHistory.create({
        data: {
          userId: user.id,
          role_triggered: 'REDEEM',
          coin_acc_amount: coinAmount,
          type: CoinHistoryType.APPLICATION,
          source: 'REDEEM',
        },
    });

      await tx.walletHistory.create({
        data: {
          userId: user.id,
          amount: Number(totalValue).toFixed(2),
          type: 'credit',
          transactionId: this.txIdService.generate(),
          transactionType: WalletTransactionType.EARNING,
          status: WalletTransactionStatus.SUCCESS,
          currency: 'SGD',
          message: `Redeemed ${coinAmount} coins for ${Number(totalValue).toFixed(2)} SGD.`,
        },
      });

    //  notification
    if (userRecord.fcmToken) {
      await this.emailQueueService.queuePushNotification({
        userId: user.id,
        fcmToken: userRecord.fcmToken,
        type: "COIN_REDEEMED",
        title: 'Coins Redeemed',
        body: `You have redeemed ${coinAmount} coins for a value of ${((coinAmount * basePrice)/100).toFixed(2)} SGD.`,
      });
    }

    return {
      success: true,
      coinsUsed: coinAmount,
      valueInCent: coinAmount * basePrice,
    };
    });
    }


    // 
    async basePrice() {
      const result = await this.prisma.coin.aggregate({
        _avg: {
          coin_value_in_cent: true,
        },
      });

      const avgPrice = result._avg.coin_value_in_cent ?? 0;

      return avgPrice;
    }


    async collectCoin(userId: number, coinAmount: number) {

      const userExit = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!userExit) throw new NotFoundException('User not found');
      // 
      const coinExit = await this.prisma.coin.findFirst({
        where: {
          key: "ORDER_PLACED"
        }
      })
      if (!coinExit) throw new NotFoundException('Coin not found');
      // 
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          total_coin_acc: Number(userExit.total_coin_acc) + Number(coinAmount),
          current_coin_balance: Number(userExit.current_coin_balance) + Number(coinAmount)
        }
      })
      const data = await this.prisma.coinHistory.create({
        data: {
          userId: userId,
          role_triggered: "ORDER_PLACED",
          coin_acc_amount: coinExit.coin_amount,
          type: CoinHistoryType.ACCUMULATION,
        }
      })
      //  SEND NOTIFICATION
      if (data && userExit.fcmToken) {
        await this.emailQueueService.queuePushNotification({
          userId: userId,
          fcmToken: userExit.fcmToken,
          type: "COIN_CREDITED",
          title: "Coin Accumulated",
          body: "You have accumulated " + coinExit.coin_amount + " coins",
        })
      }



      return data;
  }

  
  //  
  async coinAccHistory(id: number) {
    try {
      const data = await this.prisma.coinHistory.findMany({
        where: {
          userId: id
        },
        orderBy: {
          created_at: 'desc',
        }
      });
      return data;
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch user wallet history');
    }
  }
  
  // find all logs
    async findAllLogs(filterDto: DateByFilterDto) {
    const {
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      search,
    } = filterDto;

    const skip = (page - 1) * limit;

    const where: any = {
      createdAt: {
        gte: fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : undefined,
        lte: toDate ? new Date(`${toDate}T23:59:59.999Z`) : undefined,
      },
    };

    // Optional search (adjust fields based on your schema)
    if (search) {
      where.OR = [
        {
          action: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

  const [data, total] = await this.prisma.$transaction([
    this.prisma.coinLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    this.prisma.coinLog.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


async giftCoins(dto: GiftCoinsDto, adminId: number) {
  const { userId, coins, expiresInDays, reason, message } = dto;

  // ================= USER VALIDATION =================
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (coins <= 0) {
    throw new BadRequestException('Coins must be greater than 0');
  }

  return this.prisma.$transaction(async (tx) => {
    // ================= UPDATE USER BALANCE =================
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        total_coin_acc: { increment: coins },
        current_coin_balance: { increment: coins },
      },
    });

    // ================= COIN HISTORY =================
    const history = await tx.coinHistory.create({
      data: {
        userId,
        role_triggered: 'ADMIN_GIFT',
        coin_acc_amount: coins,
        edited_by: `ADMIN_${adminId}`,
        type: 'GIFT',
      },
    });

    // ================= ACCUMULATION SNAPSHOT =================
    await tx.coinAccHistory.upsert({
      where: { userId },
      update: {
        coin_amount: updatedUser.total_coin_acc,
        role_triggered: 'ADMIN_GIFT',
        edited_by: `ADMIN_${adminId}`,
      },
      create: {
        userId,
        coin_amount: updatedUser.total_coin_acc,
        role_triggered: 'ADMIN_GIFT',
        edited_by: `ADMIN_${adminId}`,
      },
    });

    // ================= ACTIVITY LOG =================
    await tx.activityLog.create({
      data: {
        action: 'CREATE',
        entity_type: 'COIN_GIFT',
        entity_id: history.id,
        user_id: adminId,
        meta: {
          userId,
          coins,
          expiresInDays,
          reason,
        },
      },
    });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiresInDays);

    // ================= NOTIFICATION =================
    if (user.fcmToken) {
      await this.emailQueueService.queuePushNotification({
        userId: user.id,
        fcmToken: user.fcmToken,
        type: "COIN_CREDITED",
        title: '🎁 Coins Received',
        body:
          message ??
          `Hello ${user.username}, you've been gifted ${coins} coins!`,
      });
    }

    return {
      message: 'Coins gifted successfully',
      data: {
        userId,
        username: user.username,
        giftedCoins: coins,
        currentBalance: updatedUser.current_coin_balance,
        totalAccumulated: updatedUser.total_coin_acc,
        expiresAt: expiryDate,
      },
    };
  });
}






}