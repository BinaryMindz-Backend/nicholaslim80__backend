import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DisputeIssueType,
  DisputePriority,
  TransactionType,
} from '@prisma/client';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class DisputeService {
  constructor(private readonly prisma: PrismaService) {}

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
  async findAll(query: any) {
    return await this.prisma.dispute.findMany({
      where: {
        orderId: query.orderId,
        createdById: query.createdById,
        status: query.status,
        deletedAt: null,
      },
      orderBy: { created_at: 'desc' },
    });
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
        tx_status: 'COMPLETED',
        payment_status: 'SUCCESS',
        transaction_code: `DSP-${Date.now()}`,
      },
    });
  }

  // -------------------------
  async resolve(dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: dto.disputeId },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const order = await this.prisma.order.findUnique({
      where: { id: dispute.orderId ?? undefined },
    });
    if (!order) throw new NotFoundException('Order not found');

    let userAmount = 0;
    let riderAmount = 0;

    if (dto.refundType === 'FULL') {
      userAmount = dto.totalAmount;
    } else {
      userAmount = (dto.totalAmount * (dto.userPercent ?? 0)) / 100;
      riderAmount = (dto.totalAmount * (dto.riderPercent ?? 0)) / 100;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: dto.disputeId },
        data: {
          status: 'RESOLVED',
          refundType: dto.refundType,
          refundAmount: dto.totalAmount,
          userPercent: dto.userPercent,
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

      if (riderAmount > 0 && order.assign_rider_id) {
        const rider = await tx.raider.findUnique({
          where: { id: order.assign_rider_id },
        });

        if (rider?.userId) {
          await this.creditWallet(
            tx,
            rider.userId,
            riderAmount,
            order.id,
            'DISPUTE_COMPENSATION',
          );
        }
      }
    });

    return { success: true };
  }
}
