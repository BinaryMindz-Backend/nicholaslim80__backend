import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  Prisma,
  AdjustmentAction,
  AdjustmentStatus,
} from '@prisma/client';
import { WalletAdjustmentDto } from './dto/wallet_adj.dto';
import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';

@Injectable()
export class WalletAdjustmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  async adjustWallet(dto: WalletAdjustmentDto, adminId: number) {
    if (!dto.userId && !dto.raiderId) {
      throw new BadRequestException('Either userId or raiderId required');
    }

    if (dto.userId && dto.raiderId) {
      throw new BadRequestException('Cannot target both user and raider');
    }

    return this.prisma.$transaction(async (tx) => {
      //  CREATE ADJUSTMENT
      const adjustment = await tx.walletAdjustment.create({
        data: {
          ...dto,
          adminId,
          status: AdjustmentStatus.COMPLETED,
          isConfirmedByAdmin: true,
        },
      });

      // RESOLVE TARGET 
      const targetUser = dto.userId
        ? await tx.user.findUnique({ where: { id: dto.userId } })
        : dto.raiderId
        ? (
            await tx.raider.findUnique({
              where: { id: dto.raiderId },
              include: { user: true },
            })
          )?.user
        : null;

      if (!targetUser) {
        throw new NotFoundException('Target user not found');
      }

      const currentBalance = Number(targetUser.currentWalletBalance || 0);
      const totalBalance = Number(targetUser.totalWalletBalance || 0);
      const amount = Number(dto.amount);

      //  VALIDATION 
      if (
        dto.adjustmentAction === AdjustmentAction.DEDUCT_MINUS_FUNDS &&
        currentBalance < amount
      ) {
        throw new BadRequestException('Insufficient balance');
      }

      //  CALCULATE
      let newCurrent = currentBalance;
      let newTotal = totalBalance;

      if (dto.adjustmentAction === AdjustmentAction.ADD_CREDIT_FUNDS) {
        newCurrent += amount;
        newTotal += amount; // ✅ increase lifetime
      } else {
        newCurrent -= amount;
        // ❌ do NOT reduce totalWalletBalance
      }

      // UPDATE USER 
      await tx.user.update({
        where: { id: targetUser.id },
        data: {
          currentWalletBalance: newCurrent,
          totalWalletBalance: newTotal,
        },
      });

      //  HISTORY 
      await tx.walletHistory.create({
        data: {
          transactionId: `TXN-${Date.now()}`,
          transactionType: 'ADMIN_ADJUSTMENT',
          adjustmentId: adjustment.id,
          userId: targetUser.id,
        //   raiderId: dto.raiderId ?? null,
          amount: amount,
          type:
            dto.adjustmentAction === AdjustmentAction.ADD_CREDIT_FUNDS
              ? 'credit'
              : 'debit',
          status: 'SUCCESS',
        },
      });

      //  ACTIVITY LOG 
      await tx.activityLog.create({
        data: {
          action: 'CREATE',
          entity_type: 'WALLET_ADJUSTMENT',
          entity_id: adjustment.id,
          user_id: adminId,
          meta: {
            targetUserId: targetUser.id,
            raiderId: dto.raiderId ?? null,
            amount,
            action: dto.adjustmentAction,
            before: {
              currentBalance,
              totalBalance,
            },
            after: {
              currentBalance: newCurrent,
              totalBalance: newTotal,
            },
          } as Prisma.JsonObject,
        },
      });

      //  NOTIFICATION 
      if (dto.isNotify && targetUser.fcmToken) {
        await this.emailQueue.queuePushNotification({
          userId: targetUser.id,
          fcmToken: targetUser.fcmToken,
          title: 'Wallet Updated',
          body:
            dto.adjustmentAction === AdjustmentAction.ADD_CREDIT_FUNDS
              ? `৳${amount} added to your wallet`
              : `৳${amount} deducted from your wallet`,
        });
      }

      return {
        success: true,
        adjustmentId: adjustment.id,
        balance: {
          current: newCurrent,
          total: newTotal,
        },
      };
    });
  }
}