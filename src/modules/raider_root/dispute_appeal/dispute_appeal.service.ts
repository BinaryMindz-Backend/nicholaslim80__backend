import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { ActivityLogService } from 'src/modules/superadmin_root/additional_services/activity_logs.services';
import { IUser } from 'src/types';
import { CreateDisputeAppealDto } from './dto/create-dispute_appeal.dto';
import { DisputeAppealQueryDto } from './dto/dispute-appeal-query.dto';
import { ResolveDisputeAppealDto } from './dto/resolve_dispute.dto';
import { AppealStatus } from '@prisma/client';
import { DisputeService } from 'src/modules/superadmin_root/dispute/dispute.service';
import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';


@Injectable()
export class DisputeAppealService {
  private readonly logger = new Logger(DisputeAppealService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly disputeService: DisputeService,
    private readonly emailQueueService: EmailQueueService,
  ) { }

  // -------------------------
  async create(dto: CreateDisputeAppealDto, user: IUser) {
    // Validate the dispute exists and is RESOLVED
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: dto.orderDisputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== 'RESOLVED') {
      throw new BadRequestException(
        'Appeals can only be filed against resolved disputes',
      );
    }

    if (dispute.is_closed) {
      throw new BadRequestException(
        'Cannot appeal a closed dispute',
      );
    }

    // Ensure the order matches the dispute
    if (dispute.orderId !== dto.orderId) {
      throw new BadRequestException(
        'Order ID does not match the dispute',
      );
    }

    // Ensure the user is a participant of this dispute
    const isParticipant =
      dispute.userId === user.id || dispute.riderId === user.id;

    if (!isParticipant) {
      throw new BadRequestException(
        'You are not a participant of this dispute',
      );
    }

    // Prevent duplicate appeal by the same user on the same dispute
    const existingAppeal = await this.prisma.disputeAppeal.findFirst({
      where: { orderDisputeId: dto.orderDisputeId },
    });

    if (existingAppeal) {
      throw new BadRequestException(
        'An appeal already exists for this dispute',
      );
    }

    const appeal = await this.prisma.disputeAppeal.create({
      data: {
        orderDisputeId: dto.orderDisputeId,
        orderId: dto.orderId,
        reason: dto.reason,
        fileUrl: dto.fileUrl,
      },
      include: {
        orderDispute: true,
        order: true,
      },
    });

    await this.activityLogService.log({
      action: 'CREATE',
      entityType: 'DisputeAppeal',
      entityId: appeal.id,
      userId: user.id,
      meta: {
        action: 'CREATE_APPEAL',
        orderDisputeId: dto.orderDisputeId,
        orderId: dto.orderId,
      },
    });

    return appeal;
  }

  // -------------------------
  async findAll(dto: DisputeAppealQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dto.orderDisputeId) where.orderDisputeId = dto.orderDisputeId;
    if (dto.orderId) where.orderId = dto.orderId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.disputeAppeal.findMany({
        where,
        include: {
          orderDispute: {
            include: {
              disputeType: true,
              user: true,
              rider: true,
            },
          },
          order: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.disputeAppeal.count({ where }),
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
  async findOne(id: number) {
    const appeal = await this.prisma.disputeAppeal.findUnique({
      where: { id },
      include: {
        orderDispute: {
          include: {
            disputeType: true,
            user: true,
            rider: true,
          },
        },
        order: true,
      },
    });

    if (!appeal) throw new NotFoundException('Appeal not found');

    return appeal;
  }

  // -------------------------
  async delete(id: number, userId: number) {
    const appeal = await this.prisma.disputeAppeal.findUnique({
      where: { id },
    });

    if (!appeal) throw new NotFoundException('Appeal not found');

    await this.prisma.disputeAppeal.delete({ where: { id } });

    await this.activityLogService.log({
      action: 'DELETE',
      entityType: 'DisputeAppeal',
      entityId: id,
      userId,
      meta: { deleted: appeal },
    });

    return { message: 'Appeal deleted successfully' };
  }

  // ------------------------- 
  async resolveAppeal(dto: ResolveDisputeAppealDto) {
    const appeal = await this.prisma.disputeAppeal.findUnique({
      where: { id: dto.appealId },
      include: {
        orderDispute: {
          include: {
            order: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!appeal) throw new NotFoundException('Appeal not found');

    if (
      appeal.status !== AppealStatus.PENDING &&
      appeal.status !== AppealStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Appeal is already resolved');
    }

    const order = appeal.orderDispute.order;
    if (!order) throw new NotFoundException('Order not found');

    // Fetch rider separately (same pattern as dispute.service.ts)
    const rider = order.assign_rider_id
      ? await this.prisma.user.findFirst({
        where: { raiderProfile: { id: order.assign_rider_id } },
      })
      : null;

    let userAmount = 0;
    let riderAmount = 0;

    if (dto.status === 'ACCEPTED' && dto.totalAmount) {
      if (dto.refundType === 'FULL') {
        userAmount = dto.totalAmount;
      } else {
        userAmount = dto.totalAmount;
        riderAmount = (dto.totalAmount * (dto.riderPercent ?? 0)) / 100;
        const companyAmount = (dto.totalAmount * (dto.companyPercent ?? 0)) / 100;

        if (rider && rider.currentWalletBalance < riderAmount) {
          throw new BadRequestException('Rider has insufficient balance');
        }

        if (companyAmount + riderAmount !== dto.totalAmount) {
          throw new BadRequestException('Invalid percentage split');
        }
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Resolve the appeal itself
      await tx.disputeAppeal.update({
        where: { id: dto.appealId },
        data: {
          status: dto.status,
          adminNote: dto.adminNote,
          resolvedByAdminId: dto.adminId,
          resolvedAt: new Date(),
        },
      });

      // 2. Update the parent dispute
      if (dto.status === 'ACCEPTED') {
        await tx.dispute.update({
          where: { id: appeal.orderDisputeId },
          data: {
            hasAppeal: false,
            status: dto.totalAmount ? 'RESOLVED' : 'UNDER_REVIEW',
            ...(dto.totalAmount && {
              refundAmount: dto.totalAmount,
              companyPercent: dto.companyPercent,
              riderPercent: dto.riderPercent,
              refundType: dto.refundType,
              resolvedByAdminId: dto.adminId,
              resolvedAt: new Date(),
            }),
          },
        });

        // 3. Deduct from rider if partial
        if (riderAmount > 0 && rider) {
          await tx.user.update({
            where: { id: rider.id },
            data: {
              totalWalletBalance: { decrement: riderAmount },
              currentWalletBalance: { decrement: riderAmount },
            },
          });
        }

        // 4. Credit user wallet
        if (userAmount > 0 && order.userId) {
          await this.disputeService.creditWallet(
            tx,
            order.userId,
            userAmount,
            appeal.orderId,
            'DISPUTE_REFUND',
          );
        }
      } else {
        // REJECTED — just clear the flag, dispute stays RESOLVED
        await tx.dispute.update({
          where: { id: appeal.orderDisputeId },
          data: { hasAppeal: false },
        });
      }
    });

    // 5. Notifications
    try {
      if (order.user?.fcmToken) {
        await this.emailQueueService.queuePushNotification({
          userId: order.user.id,
          fcmToken: order.user.fcmToken,
          type: 'APPEAL_RESOLVED',
          title: 'Appeal Resolved',
          body:
            dto.status === 'ACCEPTED'
              ? `Your appeal was accepted. Refund: ${userAmount}`
              : 'Your appeal was reviewed and rejected.',
        });
      }

      if (rider?.fcmToken) {
        await this.emailQueueService.queuePushNotification({
          userId: rider.id,
          fcmToken: rider.fcmToken,
          type: 'APPEAL_RESOLVED',
          title: 'Appeal Resolved',
          body:
            riderAmount > 0
              ? `Dispute appeal resolved. Deducted: ${riderAmount}`
              : 'A dispute appeal on your order has been resolved.',
        });
      }
    } catch (err) {
      this.logger.error('Notification error', err);
    }

    // 6. Activity log
    await this.activityLogService.log({
      action: 'UPDATE',
      entityType: 'DisputeAppeal',
      entityId: dto.appealId,
      userId: dto.adminId,
      meta: {
        action: 'RESOLVE_APPEAL',
        status: dto.status,
        orderId: order.id,
        financials: { userAmount, riderAmount },
      },
    });

    return { success: true };
  }

}