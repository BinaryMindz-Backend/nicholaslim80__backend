import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCoinManagementDto } from './dto/update-coin_management.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ApiResponses } from 'src/common/apiResponse';
import { IUser } from 'src/types';
import { CreateCoinDto } from './dto/create-coin_management.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CoinManagementService {
  constructor(private readonly prisma: PrismaService) { }

  // 
  async create(   createCoinDto: CreateCoinDto) {
    // 
    const dataExist = await this.prisma.coin.findFirst({
      where: {
        OR: [
          { key: createCoinDto.key },
        ],
      },
    });

    // 
    if (dataExist) {
      return ApiResponses.error("This Event Coin data already exit")
    }
    // 
    const data = await this.prisma.coin.create({
      data:createCoinDto
    });
    // 
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
        role: {
          name: UserRole.USER,
        },
        total_coin_acc:{
            gt:0
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
  async update(id: number, updateCoinManagementDto: UpdateCoinManagementDto) {

    const existData = await this.prisma.coin.findFirst({
      where: {
        id
      }
    })
    if (!existData) {
      return ApiResponses.error("Your Coin data not found")
    }
    const updated = await this.prisma.coin.update({
      where: {
        id
      },
      data: {
        ...updateCoinManagementDto
      }
    })
    return updated
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

  async redeemCoin(user: IUser, coin: number) {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userRecord) {
      throw new NotFoundException('User not found');
    }

    if (userRecord.current_coin_balance < coin) {
      throw new BadRequestException('Insufficient coin balance');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        current_coin_balance: {
          decrement: coin,
        },
      },
    });
    return updatedUser;
  }
  
  async basePrice() {
    const result = await this.prisma.coin.aggregate({
      _avg: {
        coin_value_in_cent: true,
      },
    });

    const avgPrice = result._avg.coin_value_in_cent ?? 0;

    return avgPrice;
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

}