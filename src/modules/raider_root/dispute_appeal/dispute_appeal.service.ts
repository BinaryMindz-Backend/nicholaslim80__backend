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


@Injectable()
export class DisputeAppealService {
  private readonly logger = new Logger(DisputeAppealService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
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
}