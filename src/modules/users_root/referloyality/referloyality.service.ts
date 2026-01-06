import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CoinEvent, CoinHistoryType } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { IUser } from 'src/types';

@Injectable()
export class ReferloyalityService {
   constructor(private readonly prisma:PrismaService){}


  // for admin to find all referral
  async findAll(referCode?: string): Promise<any[]> {
 
     let totalRefer: any[] = [];

  if (referCode) {
      totalRefer = await this.prisma.refer.findMany({
      where: {
        refer_code: referCode,
      },
      include:{
         user:true,
      }
    });
  } else {
    totalRefer = await this.prisma.refer.findMany();
  }

  return totalRefer;
  }

  async findOne(id: number) {
      // 
     const record = await this.prisma.refer.findUnique({
          where:{
              id
          }
     })

    return record
  }

  // refer count
  async referCount(referCode?: string): Promise<number> {
    let totalCount: number;

    if (referCode) {
      totalCount = await this.prisma.refer.count({
        where: {
          refer_code: referCode,
        },
      });
    } else {
      totalCount = await this.prisma.refer.count();
    }

    return totalCount;
  }

  
  
  // delete for testing
  async delete(id: number) {
      // 
     const record = await this.prisma.refer.delete({
          where:{
              id
          }
     })

    return record
  }

  // 
  async redeemPoint(user: IUser, pointAmount: number) {
    // ---------------- Fetch User ----------------
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!userRecord) throw new NotFoundException('User not found');

    // ---------------- Check Balance ----------------
    if ((userRecord.reward_points ?? 0) < pointAmount) {
      throw new BadRequestException('Insufficient reward point');
    }

    // ---------------- Get Base Coin Value ----------------
    const basePoint = await this.prisma.coin.aggregate({
      _avg: { coin_value_in_cent: true},
    });
    const basePrice = Number(basePoint._avg.coin_value_in_cent ?? 0);

    // ---------------- Deduct Coins ----------------
     
    // convert cent money
    const balanceInfloat = (Number(basePrice) * Number(pointAmount)) / 100

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        totalWalletBalance:{increment:balanceInfloat},
        currentWalletBalance:{increment:balanceInfloat},
        reward_points: { decrement: pointAmount },
      },
    });
    

    // ---------------- Record Coin History ----------------
    await this.prisma.coinHistory.create({
      data: {
        userId: user.id,
        role_triggered: CoinEvent.REFERRAL, // example role, or your own context
        coin_acc_amount: pointAmount,
        type: CoinHistoryType.APPLICATION, // spending
      },
    });
    // 
    
    return {
      updatedUser,
      redeemedAmountInCent: pointAmount * basePrice,
    };
}




}
