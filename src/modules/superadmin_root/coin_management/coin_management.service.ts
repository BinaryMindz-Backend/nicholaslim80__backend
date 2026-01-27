import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCoinManagementDto } from './dto/update-coin_management.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ApiResponses } from 'src/common/apiResponse';
import { IUser } from 'src/types';
import { CreateCoinDto } from './dto/create-coin_management.dto';
import { CoinEvent, CoinHistoryType, UserRole } from '@prisma/client';
import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';

@Injectable()
export class CoinManagementService {
  constructor(private readonly prisma: PrismaService,
    private readonly emailQueueService: EmailQueueService
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


  async remove(id: number) {
    const exitData = await this.prisma.coin.findFirst({
      where: {
        id
      }
    })
    if (!exitData) {
      return ApiResponses.error("Your Coin data not found")
    }
    return await this.prisma.coin.delete({
      where: {
        id
      }
    })
  }
  //  
  async redeemCoin(user: IUser, coinAmount: number) {
    // ---------------- Fetch User ----------------
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!userRecord) throw new NotFoundException('User not found');

    // ---------------- Check Balance ----------------
    if ((userRecord.current_coin_balance ?? 0) < coinAmount) {
      throw new BadRequestException('Insufficient coin balance');
    }

    // ---------------- Get Base Coin Value ----------------
    const baseCoin = await this.prisma.coin.aggregate({
      _avg: { coin_value_in_cent: true },
    });
    const basePrice = Number(baseCoin._avg.coin_value_in_cent ?? 0);

    // ---------------- Deduct Coins ----------------
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        current_coin_balance: { decrement: coinAmount },
      },
    });

    // ---------------- Record Coin History ----------------
    const data = await this.prisma.coinHistory.create({
      data: {
        userId: user.id,
        role_triggered: CoinEvent.COMPLETED_ORDER, // example role, or your own context
        coin_acc_amount: coinAmount,
        type: CoinHistoryType.APPLICATION, // spending
      },
    });
    //  SEND NOTIFICATION
    if (data && userRecord.fcmToken) {
      await this.emailQueueService.queuePushNotification({
        userId: user.id,
        fcmToken: userRecord.fcmToken,
        title: "Coin Redeemed",
        body: "You have redeemed " + coinAmount + " coins",
      })
    }
    return {
      updatedUser,
      redeemedAmountInCent: coinAmount * basePrice,
    };
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
        title: "Coin Accumulated",
        body: "You have accumulated " + coinExit.coin_amount + " coins",
      })
    }



    return data;
  }


  //     await this.prisma.user.update({
  //       where: {
  //         id: user.id
  //       },
  //       data: {
  //         reward_points: Number(userExit.reward_points) + Number(coinExit.coin_amount)
  //       }
  //     })
  //     const data = await this.prisma.coinHistory.create({
  //       data: {
  //         userId: user.id,
  //         total_coin_acc: coinExit.coin_amount,
  //         type: CoinHistoryType.ACCUMULATION,
  //       }
  //     })
  //     return data;
  //   } catch (error) {
  //     return ApiResponses.error(error);
  //   }
  // }

  // async reedomCoinHistory() {
  //   try {
  //     const data = await this.prisma.coinHistory.findMany({
  //       orderBy: {
  //         created_at: 'desc',
  //       }
  //     });

  //     const userMap = new Map<number, any>();

  //     for (const item of data) {
  //       if (!userMap.has(item.userId)) {
  //         userMap.set(item.userId, {
  //           id: item.id,
  //           userId: item.userId,
  //           acumulated_coin: Number(item.total_coin_acc),
  //           name: item.username,
  //           totalCoin: (await this.prisma.user.findFirst({
  //             where: { id: item.userId }
  //           }))?.reward_points || 0,
  //         });
  //       }

  //       const userData = userMap.get(item.userId);
  //       userData.totalCoin += Number(item.total_coin_acc ?? 0);
  //     }

  //     return Array.from(userMap.values())
  //   } catch (error) {
  //     return ApiResponses.error(error, 'Failed to fetch coin history');
  //   }
  // }


  // get coin acc history
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
  async findAllLogs(fromDate?: string, toDate?: string) {
  return await this.prisma.coinLog.findMany({
    where: {
      createdAt: {
        gte: fromDate ? new Date(fromDate) : undefined,
        lte: toDate ? new Date(toDate) : undefined,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}





}