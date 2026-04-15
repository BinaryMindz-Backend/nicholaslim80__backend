import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UpdateIncentiveDto } from './dto/update-incentive.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  IncentiveStatus,
  MonthName,
  Prisma,
  RaiderStatus,
  RecurringType,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';
import { TransactionIdService } from 'src/common/services/transaction-id.service';
import { IncentiveQueryDto } from './dto/incentive-query.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DateByFilterDto } from '../customer_order_confirmation/dto/date-filter.dto';
import { CreateIncentiveDto, MONTH_MAX_DAYS } from './dto/create-incentive.dto';

@Injectable()
export class IncentiveService {
  private readonly logger = new Logger(IncentiveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private txIdService: TransactionIdService,
  ) {}

  // ─── Shared schedule validator ─────────────────────────────────────────────
  private validateSchedule(dto: CreateIncentiveDto | UpdateIncentiveDto): void {
    const type = dto.recurring_type;
    if (!type) return; // nothing to validate on partial update

    // ── WEEKLY: must have days_of_week ──────────────────────────────────────
    if (type === RecurringType.WEEKLY) {
      if (!dto.days_of_week || dto.days_of_week.length === 0) {
        throw new BadRequestException(
          'WEEKLY schedule requires at least one day in days_of_week',
        );
      }
    }

    // ── MONTHLY: must have month + (day_of_month OR week_of_month) ──────────
    if (type === RecurringType.MONTHLY) {
      if (!dto.month) {
        throw new BadRequestException('MONTHLY schedule requires a month');
      }

      const hasDay  = dto.day_of_month  && dto.day_of_month.length  > 0;
      const hasWeek = dto.week_of_month && dto.week_of_month.length > 0;

      if (!hasDay && !hasWeek) {
        throw new BadRequestException(
          'MONTHLY schedule requires either day_of_month or week_of_month (+ days_of_week)',
        );
      }

      // week_of_month path also needs days_of_week
      if (hasWeek && (!dto.days_of_week || dto.days_of_week.length === 0)) {
        throw new BadRequestException(
          'MONTHLY week_of_month path requires days_of_week to be defined',
        );
      }

      // Validate day_of_month values don't exceed month's max days
      if (hasDay) {
        const maxDay = MONTH_MAX_DAYS[dto.month as MonthName];
        const invalidDays = dto.day_of_month!.filter((d) => d > maxDay);
        if (invalidDays.length > 0) {
          throw new BadRequestException(
            `Month ${dto.month} does not have day(s): ${invalidDays.join(', ')}. Max day is ${maxDay}.`,
          );
        }
      }
    }

    // ── ONE_TIME: end_date must NOT be provided ─────────────────────────────
    if (type === RecurringType.ONE_TIME && dto.end_date) {
      // Allow but ignore — or strictly reject:
      // throw new BadRequestException('ONE_TIME schedule should not have an end_date');
    }
  }

  // ─── Deactivate expired incentives (hourly cron) ───────────────────────────
  @Cron(CronExpression.EVERY_HOUR)
  async deactivateExpiredIncentives() {
    const now = new Date();
    const result = await this.prisma.incentive.updateMany({
      where: {
        end_date: { lt: now },
        status: IncentiveStatus.ACTIVE,
      },
      data: { status: IncentiveStatus.DISABLED },
    });
    if (result.count > 0) {
      this.logger.log(`Deactivated ${result.count} expired incentives.`);
    } else {
      this.logger.log('No expired incentives to deactivate.');
    }
  }

  // ─── Create ────────────────────────────────────────────────────────────────
  async create(dto: CreateIncentiveDto, adminId?: number, role?: string) {
    const now       = new Date();
    const startDate = new Date(dto.start_date);
    const endDate   = dto.end_date ? new Date(dto.end_date) : undefined;

    // Validate dates
    if (startDate < now) {
      throw new BadRequestException('Start date cannot be in the past');
    }
    if (endDate && endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Validate schedule config
    this.validateSchedule(dto);

    if (!dto.serviceZoneIds || dto.serviceZoneIds.length === 0) {
      throw new BadRequestException('At least one service zone must be selected');
    }

    // Validate driver types
    if (dto.driver_type_ids && dto.driver_type_ids.length > 0) {
      const driverTypes = await this.prisma.vehicleType.findMany({
        where: { id: { in: dto.driver_type_ids } },
        select: { id: true },
      });
      const foundIds   = driverTypes.map((dt) => dt.id);
      const invalidIds = dto.driver_type_ids.filter((id) => !foundIds.includes(id));
      if (invalidIds.length > 0) {
        throw new NotFoundException(`Invalid driver type IDs: ${invalidIds.join(', ')}`);
      }
    }

    const createdIncentives: any[] = [];

    for (const zoneId of dto.serviceZoneIds) {
      const zone = await this.prisma.serviceZone.findUnique({ where: { id: zoneId } });
      if (!zone) throw new NotFoundException(`Service zone with ID ${zoneId} not found`);

      const incentiveData: any = {
        adminId,
        name:         dto.name,
        description:  dto.description,
        start_date:   startDate,
        end_date:     endDate,

        // ── Schedule fields ────────────────────────────────────────────────
        recurring_type: dto.recurring_type,
        days_of_week:   dto.days_of_week   ?? [],
        month:          dto.month          ?? null,
        day_of_month:   dto.day_of_month   ?? [],
        week_of_month:  dto.week_of_month  ?? [],

        status:       dto.status,
        reward_type:  dto.reward_type,
        reward_value: dto.reward_value,
        claim_type:   dto.claim_type,
        claim_expire: dto.claim_expire,
        max_clam:     dto.max_claim,
        time_constant: dto.time_constant,
        priority:     dto.priority ?? 1,

        serviceZones: { connect: [{ id: zoneId }] },
        driver_types: dto.driver_type_ids?.length
          ? { connect: dto.driver_type_ids.map((id) => ({ id })) }
          : undefined,
        rules: dto.rules?.length
          ? {
              createMany: {
                data: dto.rules.map((rule) => ({
                  metric:   rule.metric,
                  operator: rule.operator,
                  value:    rule.value,
                })),
              },
            }
          : undefined,
      };

      const incentive = await this.prisma.incentive.create({
        data:    incentiveData,
        include: { rules: true, serviceZones: true, driver_types: true },
      });

      await this.prisma.incentiveLog.create({
        data: {
          incentiveId:     incentive.id,
          incentiveData:   incentive,
          changedByRole:   role ?? 'ADMIN',
          changedByAdminId: adminId,
        },
      });

      createdIncentives.push(incentive);
    }

    return createdIncentives;
  }

  // ─── Find All (admin) ──────────────────────────────────────────────────────
  async findAll(query: IncentiveQueryDto) {
    const {
      page = 1, limit = 10, startDate, endDate, search,
      sort = 'desc', status, reward_type,
      serviceZoneId, serviceZoneName, driverTypeName,
    } = query;

    const skip  = (page - 1) * limit;
    const where: Prisma.IncentiveWhereInput = {};

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) (where.AND as any[]).push({ start_date: { gte: new Date(startDate) } });
      if (endDate)   (where.AND as any[]).push({ end_date:   { lte: new Date(endDate)   } });
    }
    if (status)       where.status      = status;
    if (reward_type)  where.reward_type = reward_type;
    if (driverTypeName) {
      where.driver_types = { some: { vehicle_name: { contains: driverTypeName, mode: 'insensitive' } } };
    }
    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }
    if (serviceZoneId || serviceZoneName) {
      where.serviceZones = { some: {} };
      if (serviceZoneId)   (where.serviceZones as any).some.id   = serviceZoneId;
      if (serviceZoneName) (where.serviceZones as any).some.name = { contains: serviceZoneName, mode: 'insensitive' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.incentive.findMany({
        where, skip, take: limit,
        orderBy: { created_at: sort },
        include: { rules: true, serviceZones: true, driver_types: true },
      }),
      this.prisma.incentive.count({ where }),
    ]);

    return {
      data,
      meta: {
        total, page, limit,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  // ─── Find All for Rider ────────────────────────────────────────────────────
  async findAllIncentive(userId: number) {
    const rider = await this.prisma.raider.findUnique({
      where:   { userId },
      include: { registrations: { select: { id: true, vehicle_type: true } } },
    });
    if (!rider || !rider.registrations || rider.registrations.length === 0) {
      throw new NotFoundException('Rider or associated raider profile not found');
    }

    const res = await this.prisma.incentive.findMany({
      where: {
        status:       IncentiveStatus.ACTIVE,
        driver_types: { some: { id: rider.registrations[0].vehicle_type.id } },
        serviceZones: {},
      },
      include: { rules: true },
    });

    if (!res || res.length === 0) {
      throw new NotFoundException('No active incentives found for this rider');
    }
    return res;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────
  async stats() {
    const countAll = await this.prisma.incentive.count();
    const countActiveRider = await this.prisma.raider.count({
      where: { raider_status: RaiderStatus.ACTIVE },
    });
    const totalAmountGivenAgg = await this.prisma.collectedIncentive.aggregate({
      _sum:   { amount: true },
      _count: { id: true },
    });
    const countOngoing = await this.prisma.incentive.count({
      where: { status: IncentiveStatus.ACTIVE },
    });

    return {
      countAll, countActiveRider, countOngoing,
      totalAmountGiven:         totalAmountGivenAgg._sum.amount ?? 0,
      totalCollectedIncentives: totalAmountGivenAgg._count.id,
    };
  }

  // ─── Find One ──────────────────────────────────────────────────────────────
  async findOne(id: number) {
    return this.prisma.incentive.findFirst({ where: { id } });
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  async update(id: number, dto: UpdateIncentiveDto, adminId?: number, role?: string) {
    const rec = await this.prisma.incentive.findUnique({
      where:   { id },
      include: { rules: true, serviceZones: true },
    });
    if (!rec) throw new NotFoundException('Incentive not found');

    if (dto.start_date && new Date(dto.start_date) < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }
    if (dto.start_date && dto.end_date && new Date(dto.end_date) < new Date(dto.start_date)) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Validate updated schedule
    this.validateSchedule(dto);

    if (dto.serviceZoneIds?.length) {
      const zones    = await this.prisma.serviceZone.findMany({ where: { id: { in: dto.serviceZoneIds } }, select: { id: true } });
      const foundIds = zones.map((z) => z.id);
      const invalid  = dto.serviceZoneIds.filter((id) => !foundIds.includes(id));
      if (invalid.length) throw new NotFoundException(`Invalid service zone IDs: ${invalid.join(', ')}`);
    }

    if (dto.driver_type_ids?.length) {
      const dts      = await this.prisma.vehicleType.findMany({ where: { id: { in: dto.driver_type_ids } }, select: { id: true } });
      const foundIds = dts.map((d) => d.id);
      const invalid  = dto.driver_type_ids.filter((id) => !foundIds.includes(id));
      if (invalid.length) throw new NotFoundException(`Invalid driver type IDs: ${invalid.join(', ')}`);
    }

    if (dto.rules?.length) {
      await this.prisma.incentiveRule.deleteMany({ where: { incentiveId: id } });
      await this.prisma.incentiveRule.createMany({
        data: dto.rules.map((r) => ({
          incentiveId: id,
          metric:      r.metric,
          operator:    r.operator,
          value:       r.value,
        })),
      });
    }

    const serviceZonesUpdate = dto.serviceZoneIds?.length
      ? { set: dto.serviceZoneIds.map((zoneId) => ({ id: zoneId })) }
      : undefined;
    const driverTypesUpdate = dto.driver_type_ids?.length
      ? { set: dto.driver_type_ids.map((id) => ({ id })) }
      : undefined;

    const updateData: any = {
      ...(dto.name          !== undefined && { name:          dto.name }),
      ...(dto.description   !== undefined && { description:   dto.description }),
      ...(dto.start_date    !== undefined && { start_date:    dto.start_date }),
      ...(dto.end_date      !== undefined && { end_date:      dto.end_date }),
      ...(dto.reward_type   !== undefined && { reward_type:   dto.reward_type }),
      ...(dto.reward_value  !== undefined && { reward_value:  dto.reward_value }),
      ...(dto.claim_type    !== undefined && { claim_type:    dto.claim_type }),
      ...(dto.status        !== undefined && { status:        dto.status }),
      ...(dto.priority      !== undefined && { priority:      dto.priority }),
      ...(dto.max_claim     !== undefined && { max_clam:      dto.max_claim }),
      ...(dto.time_constant !== undefined && { time_constant: dto.time_constant }),
      ...(dto.claim_expire  !== undefined && { claim_expire:  dto.claim_expire }),

      // ── Schedule fields ──────────────────────────────────────────────────
      ...(dto.recurring_type !== undefined && { recurring_type: dto.recurring_type }),
      ...(dto.days_of_week   !== undefined && { days_of_week:   dto.days_of_week }),
      ...(dto.month          !== undefined && { month:          dto.month }),
      ...(dto.day_of_month   !== undefined && { day_of_month:   dto.day_of_month }),
      ...(dto.week_of_month  !== undefined && { week_of_month:  dto.week_of_month }),

      ...(adminId           !== undefined && { admin: { connect: { id: adminId } } }),
      ...(driverTypesUpdate &&  { driver_types:  driverTypesUpdate }),
      ...(serviceZonesUpdate && { serviceZones:  serviceZonesUpdate }),
    };

    try {
      const updated = await this.prisma.incentive.update({
        where:   { id },
        data:    updateData,
        include: { rules: true, serviceZones: true, driver_types: true },
      });

      await this.prisma.incentiveLog.create({
        data: {
          incentiveId:     updated.id,
          incentiveData:   updated,
          changedByRole:   role ?? 'ADMIN',
          changedByAdminId: adminId,
        },
      });

      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Incentive not found');
      }
      throw error;
    }
  }

  // ─── Status Update ─────────────────────────────────────────────────────────
  async statusUpdate(
    id: number,
    dto: { status?: IncentiveStatus },
    adminId?: number,
    role?: string,
  ) {
    const rec = await this.prisma.incentive.findUnique({ where: { id }, include: { rules: true } });
    if (!rec) throw new NotFoundException('Incentive not found');
    if (rec.status === dto.status) throw new BadRequestException('Incentive status is already up to date');

    const updated = await this.prisma.incentive.update({
      where:   { id },
      data:    { status: dto.status },
      include: { rules: true },
    });

    await this.prisma.incentiveLog.create({
      data: {
        incentiveId:     updated.id,
        incentiveData:   { ...updated, rules: updated.rules },
        changedByRole:   role ?? 'ADMIN',
        changedByAdminId: adminId,
      },
    });

    return updated;
  }

  // ─── Remove ────────────────────────────────────────────────────────────────
  async remove(id: number, adminId?: number, role?: string) {
    const rec = await this.prisma.incentive.findUnique({ where: { id }, include: { rules: true } });
    if (!rec) throw new NotFoundException('Incentive not found');

    await this.prisma.incentiveLog.create({
      data: {
        incentiveId:     rec.id,
        incentiveData:   { ...rec, rules: rec.rules },
        changedByRole:   role ?? 'ADMIN',
        changedByAdminId: adminId,
      },
    });

    return this.prisma.incentive.delete({ where: { id } });
  }

  // ─── Collect (manual) ──────────────────────────────────────────────────────
  async collect(id: number, userId: number) {
    const rec = await this.prisma.incentive.findUnique({
      where:   { id },
      include: { rules: true, serviceZones: true },
    });
    if (!rec)                               throw new NotFoundException('Incentive not found');
    if (rec.status === IncentiveStatus.DISABLED) throw new BadRequestException('Incentive is already ended');

    if (rec.claim_expire && rec.time_constant) {
      const expireDate = new Date(rec.created_at);
      switch (rec.time_constant) {
        case 'HOURS':   expireDate.setHours  (expireDate.getHours()   + rec.claim_expire); break;
        case 'MINUTES': expireDate.setMinutes(expireDate.getMinutes() + rec.claim_expire); break;
        case 'DAYS':    expireDate.setDate   (expireDate.getDate()    + rec.claim_expire); break;
      }
      if (new Date() > expireDate) throw new BadRequestException('This incentive has expired');
    }

    if (rec.max_clam) {
      const totalCollected = await this.prisma.collectedIncentive.count({
        where: { userId, incentiveId: id, is_collected: true },
      });
      if (totalCollected >= rec.max_clam)
        throw new BadRequestException('You have reached the maximum claim limit for this incentive');
    }

    if (rec.claim_type !== 'MANUAL') throw new BadRequestException('This incentive is not manually claimable');

    let rewardAmount = 0;
    switch (rec.reward_type) {
      case 'FIXED':      rewardAmount = Number(rec.reward_value); break;
      case 'PERCENTAGE': rewardAmount = 100 * (Number(rec.reward_value) / 100); break;
      case 'POINTS':     rewardAmount = Number(rec.reward_value); break;
    }

    const txId = this.txIdService.generate();

    return this.prisma.$transaction(async (tx) => {
      const collected = await tx.collectedIncentive.create({
        data: { userId, incentiveId: id, is_collected: true, amount: rewardAmount },
      });
      const user = await tx.user.update({
        where: { id: userId },
        data:  { totalWalletBalance: { increment: rewardAmount } },
      });
      const walletHistory = await tx.walletHistory.create({
        data: {
          transactionId:   txId,
          userId,
          amount:          rewardAmount,
          transactionType: WalletTransactionType.PAYMENT,
          type:            'credit',
          status:          WalletTransactionStatus.SUCCESS,
        },
      });
      return { collectedIncentive: collected, user, walletHistory };
    });
  }

  // ─── Logs ──────────────────────────────────────────────────────────────────
  async findAllLogs(filterDto: DateByFilterDto) {
    const { fromDate, toDate, page = 1, limit = 10, search } = filterDto;
    const skip  = (page - 1) * limit;

    const where: any = {
      createdAt: {
        gte: fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : undefined,
        lte: toDate   ? new Date(`${toDate}T23:59:59.999Z`)   : undefined,
      },
    };
    if (search) {
      where.OR = [{ 'incentiveData.name': { contains: search, mode: 'insensitive' } }];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.incentiveLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.incentiveLog.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
