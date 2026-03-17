import { BadRequestException, ConflictException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateIncentiveDto } from './dto/create-incentive.dto';
import { UpdateIncentiveDto } from './dto/update-incentive.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { IncentiveStatus, Prisma, RaiderStatus, WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { TransactionIdService } from 'src/common/services/transaction-id.service';
import { IncentiveQueryDto } from './dto/incentive-query.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class IncentiveService {
  private readonly logger = new Logger(IncentiveService.name);

  constructor(private readonly prisma: PrismaService,
    private txIdService: TransactionIdService,
  ) { }

 // Runs every hour
  @Cron(CronExpression.EVERY_HOUR)
  async deactivateExpiredIncentives() {
    const now = new Date();

    // Update all incentives where end_date < now and status is still ACTIVE
    const result = await this.prisma.incentive.updateMany({
      where: {
        end_date: { lt: now },
        status: IncentiveStatus.ACTIVE, // only active incentives
      },
      data: {
        status: IncentiveStatus.DISABLED, // mark as inactive/disabled
      },
    });

    if (result.count > 0) {
      this.logger.log(`Deactivated ${result.count} expired incentives.`);
    } else {
      this.logger.log('No expired incentives to deactivate.');
    }
  }

  // 
  async create(dto: CreateIncentiveDto, adminId?: number, role?: string) {
    const now = new Date();

    //  Validate dates
    if (new Date(dto.start_date) < now) {
      throw new BadRequestException('Start date cannot be in the past');
    }
    if (new Date(dto.end_date) < new Date(dto.start_date)) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Check overlapping incentives by date and zone
    const existing = await this.prisma.incentive.findFirst({
      where: {
        AND: [
          { serviceZoneId: dto.serviceZoneId ?? null },
          {
            OR: [
              { start_date: dto.start_date },
              { end_date: dto.end_date },
            ],
          },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Incentive already exists for this date and zone');
    }

    // Prepare incentive data
    const incentiveData: any = {
      adminId,
      name: dto.name,
      start_date: dto.start_date,
      end_date: dto.end_date,
      driver_type: dto.driver_type,
      status: dto.status,
      reward_type: dto.reward_type,
      reward_value: dto.reward_value,
      claim_type: dto.claim_type,
    };

    if (dto.description) incentiveData.description = dto.description;
    if (dto.priority) incentiveData.priority = dto.priority;
    if (dto.serviceZoneId) incentiveData.serviceZoneId = dto.serviceZoneId;

    // 4️⃣ Handle rules
    if (dto.rules && dto.rules.length > 0) {
      incentiveData.rules = {
        createMany: {
          data: dto.rules.map(rule => ({
            metric: rule.metric,
            operator: rule.operator,
            value: rule.value,
          })),
        },
      };
    }

    // Create incentive
    const incentive = await this.prisma.incentive.create({
      data: incentiveData,
      include: { rules: true },
    });

    // Log creation
    await this.prisma.incentiveLog.create({
      data: {
        incentiveId: incentive.id,
        incentiveData: {
          ...incentive,
          rules: incentive.rules,
        },
        changedByRole: role ?? 'ADMIN',
        changedByAdminId: adminId,
      },
    });

    return incentive;
  }
  // 
  async findAll(query: IncentiveQueryDto) {
  const {
    page = 1,
    limit = 10,
    startDate,
    endDate,
    search,
    sort = 'desc',
    status,
    reward_type,
    driver_type,
    serviceZoneId,
    serviceZoneName
  } = query;

  const skip = (page - 1) * limit;
  const where: Prisma.IncentiveWhereInput = {};

  // ========= DATE FILTER =========
  if (startDate || endDate) {
    where.AND = [];
    if (startDate) where.AND.push({ start_date: { gte: new Date(startDate) } });
    if (endDate) where.AND.push({ end_date: { lte: new Date(endDate) } });
  }

  // ========= STATUS =========
  if (status) where.status = status;

  // ========= REWARD TYPE =========
  if (reward_type) where.reward_type = reward_type;

  // ========= DRIVER TYPE =========
  if (driver_type) where.driver_type = driver_type;

  // ========= SEARCH =========
  if (search) {
    where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
  }
  
  // Service zone filters
  if (serviceZoneId || serviceZoneName) {
    where.serviceZone = {}; // initialize relation filter
    if (serviceZoneId) where.serviceZone.id = serviceZoneId;
    if (serviceZoneName) where.serviceZone.name = { contains: serviceZoneName, mode: 'insensitive' };
  }

  // Example full query
  const [data, total] = await this.prisma.$transaction([
    this.prisma.incentive.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: sort },
      include: { rules: true, serviceZone: true }, // include zone details
    }),
    this.prisma.incentive.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}


  // 
  async findAllIncentive() {
    // 
    const res = await this.prisma.incentive.findMany({})
    return res;
  }


  // 
 async stats() {
      // Total number of incentives
      const countAll = await this.prisma.incentive.count();

      // Total active riders
      const countActiveRider = await this.prisma.raider.count({
        where: { raider_status: RaiderStatus.ACTIVE },
      });

      // Total collected incentives and sum of rewards
      const totalAmountGivenAgg = await this.prisma.collectedIncentive.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      });

      // Total ongoing incentives
      const countOngoing = await this.prisma.incentive.count({
        where: { status: IncentiveStatus.ACTIVE }, // or ONGOING depending on your enum
      });

      return {
        countAll,
        countActiveRider,
        countOngoing,
        totalAmountGiven: totalAmountGivenAgg._sum.amount ?? 0,
        totalCollectedIncentives: totalAmountGivenAgg._count.id,
      };
    }

  // 
  async findOne(id: number) {
    // 
    const res = await this.prisma.incentive.findFirst({
      where: {
        id
      }
    })
    return res;
  }

  //
   async update(
      id: number,
      dto: UpdateIncentiveDto,
      adminId?: number,
      role?: string
    ) {
      const rec = await this.prisma.incentive.findUnique({
        where: { id },
        include: { rules: true },
      });

      if (!rec) throw new NotFoundException('Incentive not found');

      // Validate dates
      if (dto.start_date && new Date(dto.start_date) < new Date()) {
        throw new BadRequestException('Start date cannot be in the past');
      }
      if (dto.start_date && dto.end_date && new Date(dto.end_date) < new Date(dto.start_date)) {
        throw new BadRequestException('End date cannot be before start date');
      }

      //  Handle rules separately
      if (dto.rules && dto.rules.length > 0) {
        await this.prisma.incentiveRule.deleteMany({ where: { incentiveId: id } });
        await this.prisma.incentiveRule.createMany({
          data: dto.rules.map(r => ({
            incentiveId: id,
            metric: r.metric,
            operator: r.operator,
            value: r.value,
          })),
        });
      }

      // Build update object safely
      const updateData: any = {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.start_date !== undefined && { start_date: dto.start_date }),
        ...(dto.end_date !== undefined && { end_date: dto.end_date }),
        ...(dto.driver_type !== undefined && { driver_type: dto.driver_type }),
        ...(dto.reward_type !== undefined && { reward_type: dto.reward_type }),
        ...(dto.reward_value !== undefined && { reward_value: dto.reward_value }),
        ...(dto.claim_type !== undefined && { claim_type: dto.claim_type }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.serviceZoneId !== undefined && { serviceZoneId: dto.serviceZoneId }),
        ...(adminId !== undefined && { adminId }),
      };

      //  Update incentive
      const updated = await this.prisma.incentive.update({
        where: { id },
        data: updateData,
        include: { rules: true },
      });

      //  Log snapshot
      await this.prisma.incentiveLog.create({
        data: {
          incentiveId: updated.id,
          incentiveData: { ...updated, rules: updated.rules },
          changedByRole: role ?? 'ADMIN',
          changedByAdminId: adminId,
        },
      });

      return updated;
}

  // ** status update
  async statusUpdate(id: number, dto: { status?: IncentiveStatus }, adminId?: number, role?: string) {
    const rec = await this.prisma.incentive.findUnique({
      where: { id },
      include: { rules: true },
    });

    if (!rec) throw new NotFoundException("Incentive not found");
    if (rec.status === dto.status) throw new BadRequestException("Incentive status is already up to date");

    const updated = await this.prisma.incentive.update({
      where: { id },
      data: { status: dto.status },
      include: { rules: true },
    });

    // Log snapshot
    await this.prisma.incentiveLog.create({
      data: {
        incentiveId: updated.id,
        incentiveData: {
          ...updated,
          rules: updated.rules,
        },
        changedByRole: role ?? 'ADMIN',
        changedByAdminId: adminId,
      },
    });

    return updated;
  }



  //
  async remove(id: number, adminId?: number, role?: string) {
  const rec = await this.prisma.incentive.findUnique({
    where: { id },
    include: { rules: true },
  });

  if (!rec) throw new NotFoundException("Incentive not found");

  // Log deletion before removing
  await this.prisma.incentiveLog.create({
    data: {
      incentiveId: rec.id,
      incentiveData: {
        ...rec,
        rules: rec.rules,
      },
      changedByRole: role ?? 'ADMIN',
      changedByAdminId: adminId,
    },
  });

  return await this.prisma.incentive.delete({
    where: { id },
  });
}

  // collect incentive
  async collect(id: number, userId: number) {
    // Find active incentive
    const rec = await this.prisma.incentive.findUnique({
      where: { id },
      include: { rules: true, serviceZone: true }, // include rules & zone
    });

    if (!rec) throw new NotFoundException("Incentive not found");

    if (rec.status === IncentiveStatus.DISABLED)
      throw new BadRequestException("Incentive is already ended");

    // Check if user already collected it
    const collectedIncentive = await this.prisma.collectedIncentive.findFirst({
      where: {
        userId,
        incentiveId: id,
        is_collected: true,
      },
    });

    if (collectedIncentive)
      throw new BadRequestException("Incentive is already collected");

    // Check if incentive is manual claim
    if (rec.claim_type !== "MANUAL") {
      throw new BadRequestException("This incentive is not manually claimable");
    }

    // Calculate reward based on reward_type
    let rewardAmount: number = 0;

    switch (rec.reward_type) {
      case "FIXED":
        rewardAmount = Number(rec.reward_value);
        break;

      case "PERCENTAGE":
        // For percentage, calculate based on total earnings or metric — placeholder example
        // You can replace this logic with actual metric calculation
        rewardAmount = 100 * (Number(rec.reward_value) / 100); 
        break;

      case "POINTS":
        rewardAmount = Number(rec.reward_value); // could map to points system
        break;
    }

    const txId = this.txIdService.generate();

    // Transaction to collect incentive and credit wallet
    const res = await this.prisma.$transaction(async (tx) => {
      const collected = await tx.collectedIncentive.create({
        data: {
          userId,
          incentiveId: id,
          is_collected: true,
          amount: rewardAmount,
        },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: {
          totalWalletBalance: { increment: rewardAmount },
        },
      });

      const walletHistory = await tx.walletHistory.create({
        data: {
          transactionId: txId,
          userId,
          amount: rewardAmount,
          transactionType: WalletTransactionType.PAYMENT,
          type: "credit",
          status: WalletTransactionStatus.SUCCESS,
        },
      });

      return { collectedIncentive: collected, user, walletHistory };
    });

  return res;
}
  // 
  async findAllLogs(fromDate?: string, toDate?: string) {
    return await this.prisma.incentiveLog.findMany({
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

  // 


}
