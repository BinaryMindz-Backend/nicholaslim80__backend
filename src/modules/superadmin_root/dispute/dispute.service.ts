import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  DisputeIssueType,
  DisputePriority,
  PaymentStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ActivityLogService } from '../additional_services/activity_logs.services';

@Injectable()
export class DisputeService {
      private readonly logger = new Logger(DisputeService.name);
  
  constructor(
         private readonly prisma: PrismaService,
         private readonly emailQueueService: EmailQueueService,
         private readonly activityLogService: ActivityLogService,
  ) {}

  // -------------------------
  private autoPriority(issue: DisputeIssueType): DisputePriority {
    if (
      ['ORDER_NOT_RECEIVED', 'PAYMENT_DISPUTE', 'SAFETY_ACCESS_ISSUE'].includes(
        issue,
      )
    )
      return 'HIGH';

    if (
      ['WRONG_ITEM', 'DAMAGED_ITEM', 'PARTIAL_DELIVERY', 'MISDELIVERED'].includes(
        issue,
      )
    )
      return 'MEDIUM';

    return 'LOW';
  }

  // -------------------------
  async create(dto: CreateDisputeDto) {

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const active = await this.prisma.dispute.findFirst({
      where: {
        orderId: dto.orderId,
        status: { in: ['PENDING', 'UNDER_REVIEW', 'AWAITING_INFO'] },
      },
    });
    if (active) throw new BadRequestException('Active dispute exists');

    return await this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          orderId: dto.orderId,
          createdByType: dto.createdByType,
          createdById: dto.createdById,
          issueType: dto.issueType,
          description: dto.description,
          priority: this.autoPriority(dto.issueType),
          evidence: dto.evidenceids
        },
      });

      await tx.order.update({
        where: { id: dto.orderId },
        data: { isDispute: true },
      });

      return dispute;
    });
  }

  // -------------------------
  async findAll(dto: any) {
          const page = dto.page ?? 1;
        const limit = dto.limit ?? 10;
        const skip = (page - 1) * limit;

        const [data, total] = await this.prisma.$transaction([
          this.prisma.dispute.findMany({
            where: {
              orderId: dto.orderId,
              createdById: dto.createdById,
              status: dto.status,
              is_closed:false,
            },
            skip,
            take: limit
          }),
          this.prisma.dispute.count({
            where: {
              orderId: dto.orderId,
              createdById: dto.createdById,
              status: dto.status,
              is_closed:false,
            },
          }),
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

  // -------------------------
  private async creditWallet(
    tx,
    userId: number,
    amount: number,
    orderId: number,
    type: TransactionType,
  ) {
    await tx.user.update({
      where: { id: userId },
      data: {
        totalWalletBalance: { increment: amount },
        currentWalletBalance: { increment: amount },
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        orderId,
        total_fee: amount,
        type,
        tx_status: TransactionStatus.COMPLETED,
        payment_status: PaymentStatus.PAID,
        transaction_code: `DSP-${Date.now()}`,
      },
    });
  }



  // new
  async resolve(dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: dto.disputeId },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const order = await this.prisma.order.findUnique({
      where: { id: dispute.orderId ?? undefined },
      include: { user: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const raider = await this.prisma.user.findFirst({
      where: {
        raiderProfile: {
          id: order.assign_rider_id!,
        },
      },
    });

    if (!raider) {
      throw new NotFoundException('Rider not found');
    }

    let userAmount = 0;
    let riderAmount = 0;
    let companyAmount = 0;

    if (dto.refundType === 'FULL') {
      userAmount = dto.totalAmount;
    } else {
      companyAmount = (dto.totalAmount * (dto.companyPercent ?? 0)) / 100;
      riderAmount = (dto.totalAmount * (dto.riderPercent ?? 0)) / 100;

      if (raider.currentWalletBalance < riderAmount) {
        throw new BadRequestException('Rider has insufficient wallet balance');
      }

      const totalAmount = companyAmount + riderAmount;
      if (totalAmount !== dto.totalAmount) {
        throw new BadRequestException(
          'Company and Rider percentages do not sum up to total amount',
        );
      }

      userAmount = totalAmount;
    }

    await this.prisma.$transaction(async (tx) => {
      // Deduct rider balance (inside transaction ⚠️ move here)
      if (riderAmount > 0) {
        await tx.user.update({
          where: { id: raider.id },
          data: {
            totalWalletBalance: { decrement: riderAmount },
            currentWalletBalance: { decrement: riderAmount },
          },
        });
      }

      await tx.dispute.update({
        where: { id: dto.disputeId },
        data: {
          status: 'RESOLVED',
          refundType: dto.refundType,
          refundAmount: dto.totalAmount,
          companyPercent: dto.companyPercent,
          riderPercent: dto.riderPercent,
          resolvedByAdminId: dto.adminId,
          resolvedAt: new Date(),
        },
      });

      if (userAmount > 0 && order.userId) {
        await this.creditWallet(
          tx,
          order.userId,
          userAmount,
          order.id,
          'DISPUTE_REFUND',
        );
      }
    });

    // LOG AFTER SUCCESSFUL TRANSACTION
    await this.activityLogService.log({
      action: 'UPDATE',
      entityType: 'Dispute',
      entityId: dto.disputeId,
      userId: dto.adminId,
      meta: {
        action: 'RESOLVE_DISPUTE',
        disputeId: dto.disputeId,
        orderId: order.id,

        financials: {
          total: dto.totalAmount,
          refundType: dto.refundType,
          userAmount,
          riderAmount,
          companyAmount,
        },

        distribution: {
          companyPercent: dto.companyPercent,
          riderPercent: dto.riderPercent,
        },

        affectedUsers: {
          userId: order.userId,
          riderId: raider.id,
        },

        statusChange: {
          from: dispute.status,
          to: 'RESOLVED',
        },
      },
    });

    // Notifications (unchanged)
    try {
      if (order.user?.fcmToken) {
        await this.emailQueueService.queuePushNotification({
          userId: order.user.id,
          fcmToken: order.user.fcmToken,
          title: 'Dispute Resolved',
          body: `Your dispute #${dispute.id} for order #${order.id} has been resolved. Refund amount: ${userAmount}.`,
        });
      }

      if (raider.fcmToken) {
        await this.emailQueueService.queuePushNotification({
          userId: raider.id,
          fcmToken: raider.fcmToken,
          title: 'Dispute Resolved',
          body: `Dispute #${dispute.id} for order #${order.id} has been resolved. Amount deducted: ${riderAmount}.`,
        });
      }
    } catch (err) {
      this.logger.error('Failed to queue dispute push notifications:', err);
    }

    return { success: true };
  }




  //  
  async findOne(id:number){
       return await this.prisma.dispute.findFirst({
            where:{
               id
            },
            include:{
               order:{
                  select:{
                      total_cost:true,
                  }
               }
            }
          
       })
  }
    //  
    async delete(id: number, userId: number) {
      const res = await this.prisma.dispute.findFirst({
        where: { id },
      });

      if (!res) {
        throw new NotFoundException("Dispute not found");
      }

      await this.prisma.dispute.delete({
        where: { id },
      });

      await this.activityLogService.log({
        action: 'DELETE',
        entityType: 'Dispute',
        entityId: id,
        userId,
        meta: {
          deleted: res,
        },
      });

      return { message: 'Deleted successfully' };
    }

  // 
async closeCase(id: number, userId: number) {
  const res = await this.prisma.dispute.findFirst({
    where: { id },
  });

  if (!res) {
    throw new NotFoundException("Dispute not found");
  }

  const updated = await this.prisma.dispute.update({
    where: { id },
    data: { is_closed: true },
  });

  await this.activityLogService.log({
    action: 'UPDATE',
    entityType: 'Dispute',
    entityId: id,
    userId,
    meta: {
      action: 'CLOSE_CASE',
      before: { is_closed: res.is_closed },
      after: { is_closed: true },
    },
  });

  return updated;
}




}
