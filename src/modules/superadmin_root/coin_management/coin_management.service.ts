import { Injectable } from '@nestjs/common';
import { CreateCoinManagementDto } from './dto/create-coin_management.dto';
import { UpdateCoinManagementDto } from './dto/update-coin_management.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ApiResponses } from 'src/common/apiResponse';
import { IUser } from 'src/types';
import { CoinHistoryType } from '@prisma/client';

@Injectable()
export class CoinManagementService {
  constructor(private readonly prisma: PrismaService) { }
  async create(createCoinManagementDto: CreateCoinManagementDto) {
    const dataexit = await this.prisma.coin.findFirst({
      where: {
        event_triggered: createCoinManagementDto.event_triggered
      }
    })
    if (dataexit) {
      return ApiResponses.error("This Event Coin data already exit")
    }
    const data = await this.prisma.coin.create({
      data: {
        ...createCoinManagementDto,
      },
    });
    return data;
  }

  async findAll() {
    const data = await this.prisma.coin.findMany()
    return data
  }



  async update(id: number, updateCoinManagementDto: UpdateCoinManagementDto) {

    const exitData = await this.prisma.coin.findFirst({
      where: {
        id
      }
    })
    if (!exitData) {
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
  async reedomCoin(user: IUser, id: number) {
    console.log({ user });

    try {
      const userExit = await this.prisma.user.findFirst({
        where: {
          id: user.id
        }
      })
      if (!userExit) {
        return ApiResponses.error("User not found")
      }
      const coinExit = await this.prisma.coin.findFirst({
        where: {
          id
        }
      })
      if (!coinExit) {
        return ApiResponses.error("Coin data not found")
      }
      await this.prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          reward_points: Number(userExit.reward_points) + Number(coinExit.coin_amount)
        }
      })
      const data = await this.prisma.coinHistory.create({
        data: {
          userId: user.id,
          username: userExit.username,
          total_coin_acc: Number(userExit.reward_points) + Number(coinExit.coin_amount),
          type: CoinHistoryType.ACCUMULATION,
        }
      })
      return data;
    } catch (error) {
      return ApiResponses.error(error);
    }
  }


}
