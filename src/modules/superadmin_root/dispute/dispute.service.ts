import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  PaymentStatus,
  TransactionStatus,
  TransactionType,
  UserRole,
} from '@prisma/client';

import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ActivityLogService } from '../additional_services/activity_logs.services';
import { IUser } from 'src/types';
import { DisputeQueryDto } from './dto/dispute-query.dto';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueueService: EmailQueueService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  // -------------------------
  async create(dto: CreateDisputeDto, user: IUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const disputeType = await this.prisma.disputeType.findFirst({
      where: {
        id: dto.disputeTypeId,
        isActive: true,
      },
    });

    if (!disputeType) {
      throw new BadRequestException('Invalid dispute type');
    }

    const active = await this.prisma.dispute.findFirst({
      where: {
        orderId: dto.orderId,
        status: { in: ['PENDING', 'UNDER_REVIEW', 'AWAITING_INFO'] },
      },
    });

    if (active) throw new BadRequestException('Active dispute exists');

    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          orderId: dto.orderId,
          disputeTypeId: dto.disputeTypeId,
          description: dto.description,
          priority: disputeType.priority,
          evidence: dto.evidenceids,
          userId: user.roles?.some(r => r.name === UserRole.USER) ? user.id : null,
          riderId: user.roles?.some(r => r.name === UserRole.RAIDER) ? user.id : null,

        },
        include: {
          disputeType: true,
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
   async findAll(dto: DisputeQueryDto) {
      const page = dto.page ?? 1;
      const limit = dto.limit ?? 10;
      const skip = (page - 1) * limit;

      const where: any = {
        is_closed: false,
      };

      if (dto.status) where.status = dto.status;
      if (dto.orderId) where.orderId = dto.orderId;
      if (dto.userId) where.userId = dto.userId;
      if (dto.riderId) where.riderId = dto.riderId;

      // dispute type filter
      if (dto.disputeTypeId) {
        where.disputeTypeId = dto.disputeTypeId;
      }

      // date range filter
      if (dto.fromDate || dto.toDate) {
        where.created_at = {};

        if (dto.fromDate) {
          where.created_at.gte = new Date(dto.fromDate);
        }

        if (dto.toDate) {
          where.created_at.lte = new Date(dto.toDate);
        }
      }

      // participant type filter
      if (String(dto.participantType) === 'user') {
        where.userId = { not: null };
      } else if (String(dto.participantType) === 'rider') {
        where.riderId = { not: null };
      }
      // 'all'
      const [data, total] = await this.prisma.$transaction([
        this.prisma.dispute.findMany({
          where,
          include: {
            user: true,
            rider: true,
            disputeType: true,
          },
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.dispute.count({ where }),
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

  // -------------------------
  async resolve(dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findFirst({
      where: { id: dto.disputeId },
      include: { order: true },
    });

    if (!dispute) throw new NotFoundException('Dispute not found');

    const order = await this.prisma.order.findFirst({
      where: { id: dispute.orderId! },
      include: { user: true },
    });

    if (!order) throw new NotFoundException('Order not found');
     if(!order.assign_rider_id){
       throw new NotFoundException("Raider Not Assigned on this order");
     } 
    const rider = await this.prisma.user.findFirst({
      where: {
        raiderProfile: {
          id: order.assign_rider_id,
        },
      },
    });

    if (!rider) throw new NotFoundException('Rider not found');

    let userAmount = 0;
    let riderAmount = 0;
    let companyAmount = 0;

    if (dto.refundType === 'FULL') {
      userAmount = dto.totalAmount;
    } else {
      companyAmount = (dto.totalAmount * (dto.companyPercent ?? 0)) / 100;
      riderAmount = (dto.totalAmount * (dto.riderPercent ?? 0)) / 100;

      if (rider.currentWalletBalance < riderAmount) {
        throw new BadRequestException('Rider has insufficient balance');
      }

      if (companyAmount + riderAmount !== dto.totalAmount) {
        throw new BadRequestException('Invalid percentage split');
      }

      userAmount = dto.totalAmount;
    }

    await this.prisma.$transaction(async (tx) => {
      if (riderAmount > 0) {
        await tx.user.update({
          where: { id: rider.id },
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

    // ---------------- LOG
    await this.activityLogService.log({
      action: 'UPDATE',
      entityType: 'Dispute',
      entityId: dto.disputeId,
      userId: dto.adminId,
      meta: {
        action: 'RESOLVE_DISPUTE',
        orderId: order.id,
        financials: {
          total: dto.totalAmount,
          userAmount,
          riderAmount,
          companyAmount,
        },
      },
    });

    // ---------------- NOTIFICATION
    try {
      if (order.user?.fcmToken) {
        await this.emailQueueService.queuePushNotification({
          userId: order.user.id,
          fcmToken: order.user.fcmToken,
          title: 'Dispute Resolved',
          body: `Refund: ${userAmount}`,
        });
      }

      if (rider.fcmToken) {
        await this.emailQueueService.queuePushNotification({
          userId: rider.id,
          fcmToken: rider.fcmToken,
          title: 'Dispute Resolved',
          body: `Deducted: ${riderAmount}`,
        });
      }
    } catch (err) {
      this.logger.error('Notification error', err);
    }

    return { success: true };
  }

  // -------------------------
  async findOne(id: number) {
    return this.prisma.dispute.findUnique({
      where: { id },
      include: {
        user: true,
        rider: true,
        disputeType: true,
      },
    });
  }

  // -------------------------
  async delete(id: number, userId: number) {
    const res = await this.prisma.dispute.findUnique({
      where: { id },
    });

    if (!res) throw new NotFoundException('Dispute not found');

    await this.prisma.dispute.delete({
      where: { id },
    });

    await this.activityLogService.log({
      action: 'DELETE',
      entityType: 'Dispute',
      entityId: id,
      userId,
      meta: { deleted: res },
    });

    return { message: 'Deleted successfully' };
  }

  // -------------------------
  async closeCase(id: number, userId: number) {
    const res = await this.prisma.dispute.findUnique({
      where: { id },
    });

    if (!res) throw new NotFoundException('Dispute not found');

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
      },
    });

    return updated;
  }
}
