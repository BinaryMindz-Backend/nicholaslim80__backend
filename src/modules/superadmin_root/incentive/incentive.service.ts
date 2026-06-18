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
  Metric,
  MonthName,
  Operator,
  OrderStatus,
  Prisma,
  RaiderStatus,
  RecurringType,
  StopStatus,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';
import { TransactionIdService } from 'src/common/services/transaction-id.service';
import { IncentiveQueryDto } from './dto/incentive-query.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DateByFilterDto } from '../customer_order_confirmation/dto/date-filter.dto';
import { CreateIncentiveDto, MONTH_MAX_DAYS } from './dto/create-incentive.dto';
import { IncentiveRuleGroupDto } from './dto/update-incentive.dto';

@Injectable()
export class IncentiveService {
  private readonly logger = new Logger(IncentiveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private txIdService: TransactionIdService,
  ) { }

  // ─── Schedule validator ────────────────────────────────────────────────────
  private validateSchedule(dto: CreateIncentiveDto | UpdateIncentiveDto): void {
    const type = dto.recurring_type;
    if (!type) return;

    if (type === RecurringType.WEEKLY) {
      if (!dto.days_of_week || dto.days_of_week.length === 0) {
        throw new BadRequestException(
          'WEEKLY schedule requires at least one day in days_of_week',
        );
      }
    }

    if (type === RecurringType.MONTHLY) {
      if (!dto.month) {
        throw new BadRequestException('MONTHLY schedule requires a month');
      }

      const hasDay = dto.day_of_month && dto.day_of_month.length > 0;
      const hasWeek = dto.week_of_month && dto.week_of_month.length > 0;

      if (!hasDay && !hasWeek) {
        throw new BadRequestException(
          'MONTHLY schedule requires either day_of_month or week_of_month (+ days_of_week)',
        );
      }

      if (hasWeek && (!dto.days_of_week || dto.days_of_week.length === 0)) {
        throw new BadRequestException(
          'MONTHLY week_of_month path requires days_of_week to be defined',
        );
      }

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
  }

  // ─── Rule-group validator ──────────────────────────────────────────────────
  private validateRuleGroups(ruleGroups: IncentiveRuleGroupDto[]): void {
    if (!ruleGroups || ruleGroups.length === 0) return;

    const validOperators = Object.values(Operator);

    for (let gi = 0; gi < ruleGroups.length; gi++) {
      const group = ruleGroups[gi];

      if (!group.rules || group.rules.length === 0) {
        throw new BadRequestException(
          `Rule group at index ${gi} must contain at least one rule`,
        );
      }

      for (let ri = 0; ri < group.rules.length; ri++) {
        const rule = group.rules[ri];

        if (!rule.metric) {
          throw new BadRequestException(
            `Rule group ${gi}, rule ${ri}: metric is required`,
          );
        }
        if (!validOperators.includes(rule.operator as Operator)) {
          throw new BadRequestException(
            `Rule group ${gi}, rule ${ri}: invalid operator "${rule.operator}"`,
          );
        }
        if (rule.value === undefined || rule.value === null) {
          throw new BadRequestException(
            `Rule group ${gi}, rule ${ri}: value is required`,
          );
        }
      }
    }
  }

  // ─── Single-rule evaluator ─────────────────────────────────────────────────
  // Used in both collect() (manual claim) and evaluateGroup() (cron-style check).
  private evaluateRule(
    userValue: number,
    operator: Operator,
    targetValue: number,
  ): boolean {
    switch (operator) {
      case Operator.GTE: return userValue >= targetValue;
      case Operator.LTE: return userValue <= targetValue;
      case Operator.EQ: return userValue === targetValue;
      case Operator.GT: return userValue > targetValue;
      case Operator.LT: return userValue < targetValue;
      default:
        this.logger.warn(`Unknown operator "${operator}" — rule skipped (pass)`);
        return true;
    }
  }

  // ─── Single-group evaluator (AND within group) ─────────────────────────────
  private async evaluateGroup(
    userId: number,
    rules: any[],
    metricCache: Map<string, number>,
  ): Promise<boolean> {
    if (!rules || rules.length === 0) return true;

    for (const rule of rules) {
      if (!metricCache.has(rule.metric)) {
        const value = await this.getUserMetricValue(userId, rule.metric as Metric);
        metricCache.set(rule.metric, Number(value) || 0);
      }

      const userValue = metricCache.get(rule.metric)!;

      if (!this.evaluateRule(userValue, rule.operator as Operator, Number(rule.value))) {
        return false; // AND — one failure fails the whole group
      }
    }

    return true;
  }

  // ─── Group-level evaluator (OR across groups) ──────────────────────────────
  // Returns true if the user satisfies AT LEAST ONE rule group.
  // No groups = no restrictions → always qualifies.
  async userMeetsRuleGroups(
    userId: number,
    ruleGroups: any[],
  ): Promise<boolean> {
    if (!ruleGroups || ruleGroups.length === 0) return true;

    const metricCache = new Map<string, number>(); // shared across groups

    for (const group of ruleGroups) {
      const groupPasses = await this.evaluateGroup(
        userId,
        group.rules ?? [],
        metricCache,
      );
      if (groupPasses) return true; // OR — first passing group is enough
    }

    return false;
  }

  // ─── Metric fetcher ────────────────────────────────────────────────────────
  private async getUserMetricValue(userId: number, metric: Metric): Promise<number> {
    const rider = await this.prisma.raider.findFirst({
      where: { userId, isSuspended: false },
    });
    if (!rider) return 0;

    switch (metric) {
      case Metric.COMPLETED_DELIVERIES:
        return this.prisma.order.count({
          where: { assign_rider_id: rider.id, order_status: OrderStatus.COMPLETED },
        });

      case Metric.TOTAL_EARNINGS: {
        const result = await this.prisma.walletHistory.aggregate({
          _sum: { amount: true },
          where: {
            userId,
            type: 'credit',
            status: WalletTransactionStatus.SUCCESS,
            transactionType: WalletTransactionType.EARNING,
          },
        });
        return Number(result._sum.amount ?? 0);
      }

      case Metric.REFERRAL_COUNT:
        return this.prisma.refer.count({ where: { user_id: userId } });

      case Metric.ACCEPTED_ORDERS:
        return this.prisma.order.count({
          where: { assign_rider_id: rider.id, order_status: OrderStatus.COMPLETED },
        });

      case Metric.ACCEPTANCE_RATE: {
        const orders = await this.prisma.order.findMany({
          where: { assign_rider_id: rider.id },
          include: { orderStops: true },
        });
        let completed = 0, total = 0;
        for (const o of orders) {
          total += o.orderStops.length;
          completed += o.orderStops.filter(
            (s) => s.status === StopStatus.COMPLETED,
          ).length;
        }
        return total > 0 ? (completed / total) * 100 : 0;
      }

      case Metric.CONSECUTIVE_TRIPS: {
        const orders = await this.prisma.order.findMany({
          where: { assign_rider_id: rider.id },
          orderBy: { created_at: 'asc' },
          select: { order_status: true },
        });
        let max = 0, current = 0;
        for (const o of orders) {
          if (o.order_status === OrderStatus.COMPLETED) {
            current++;
            if (current > max) max = current;
          } else {
            current = 0;
          }
        }
        return max;
      }

      case Metric.ONLINE_HOURS: {
        const sessions = await this.prisma.raiderOnlineSession.findMany({
          where: { raiderId: rider.id },
          select: { startAt: true, endAt: true },
        });
        const hours = sessions.reduce((sum, s) => {
          const end = s.endAt ?? new Date();
          return sum + (end.getTime() - s.startAt.getTime()) / 3_600_000;
        }, 0);
        return Number(hours.toFixed(2));
      }

      default:
        return 0;
    }
  }

  // ─── Deactivate expired incentives (hourly cron) ──────────────────────────
  @Cron(CronExpression.EVERY_HOUR)
  async deactivateExpiredIncentives() {
    const now = new Date();
    const result = await this.prisma.incentive.updateMany({
      where: { end_date: { lt: now }, status: IncentiveStatus.ACTIVE },
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
    const now = new Date();
    const startDate = new Date(dto.start_date);
    const endDate = dto.end_date ? new Date(dto.end_date) : undefined;

    if (startDate < now) throw new BadRequestException('Start date cannot be in the past');
    if (endDate && endDate < startDate) throw new BadRequestException('End date cannot be before start date');

    this.validateSchedule(dto);
    if (dto.ruleGroups) this.validateRuleGroups(dto.ruleGroups);

    if (!dto.serviceZoneIds || dto.serviceZoneIds.length === 0) {
      throw new BadRequestException('At least one service zone must be selected');
    }

    if (dto.driver_type_ids?.length) {
      const found = await this.prisma.vehicleType.findMany({
        where: { id: { in: dto.driver_type_ids } }, select: { id: true },
      });
      const invalid = dto.driver_type_ids.filter((id) => !found.map((f) => f.id).includes(id));
      if (invalid.length) throw new NotFoundException(`Invalid driver type IDs: ${invalid.join(', ')}`);
    }

    const createdIncentives: any[] = [];

    for (const zoneId of dto.serviceZoneIds) {
      const zone = await this.prisma.serviceZone.findUnique({ where: { id: zoneId } });
      if (!zone) throw new NotFoundException(`Service zone with ID ${zoneId} not found`);

      const incentive = await this.prisma.incentive.create({
        data: {
          adminId,
          name: dto.name,
          description: dto.description,
          start_date: startDate,
          end_date: endDate,
          recurring_type: dto.recurring_type,
          days_of_week: dto.days_of_week ?? [],
          month: dto.month ?? null,
          day_of_month: dto.day_of_month ?? [],
          week_of_month: dto.week_of_month ?? [],
          status: dto.status,
          reward_type: dto.reward_type,
          reward_value: dto.reward_value,
          claim_type: dto.claim_type,
          claim_expire: dto.claim_expire,
          max_clam: dto.max_claim,
          time_constant: dto.time_constant,
          priority: dto.priority ?? 1,
          serviceZones: { connect: [{ id: zoneId }] },
          driver_types: dto.driver_type_ids?.length
            ? { connect: dto.driver_type_ids.map((id) => ({ id })) }
            : undefined,
          // ── Rule groups: AND within group, OR across groups ────────────────
          ruleGroups: dto.ruleGroups?.length
            ? {
              create: dto.ruleGroups.map((group) => ({
                label: group.label ?? null,
                rules: {
                  createMany: {
                    data: group.rules.map((rule) => ({
                      metric: rule.metric as Metric,
                      operator: rule.operator as Operator,
                      value: rule.value,
                    })),
                  },
                },
              })),
            }
            : undefined,
        },
        include: {
          ruleGroups: { include: { rules: true } },
          serviceZones: true,
          driver_types: true,
        },
      });

      await this.prisma.incentiveLog.create({
        data: {
          incentiveId: incentive.id,
          incentiveData: incentive,
          changedByRole: role ?? 'ADMIN',
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

    const skip: number = (page - 1) * limit;
    const where: Prisma.IncentiveWhereInput = {};

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) (where.AND as any[]).push({ start_date: { gte: new Date(startDate) } });
      if (endDate) (where.AND as any[]).push({ end_date: { lte: new Date(endDate) } });
    }
    if (status) where.status = status;
    if (reward_type) where.reward_type = reward_type;
    if (driverTypeName) {
      where.driver_types = { some: { vehicle_name: { contains: driverTypeName, mode: 'insensitive' } } };
    }
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    if (serviceZoneId || serviceZoneName) {
      where.serviceZones = { some: {} };
      if (serviceZoneId) (where.serviceZones as any).some.id = serviceZoneId;
      if (serviceZoneName) (where.serviceZones as any).some.name = { contains: serviceZoneName, mode: 'insensitive' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.incentive.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: sort },
        include: { ruleGroups: { include: { rules: true } }, serviceZones: true, driver_types: true },
      }),
      this.prisma.incentive.count({ where }),
    ]);

    return {
      data,
      meta: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  // ─── Find All for Rider ────────────────────────────────────────────────────
  async findAllIncentive(userId: number) {
    const rider = await this.prisma.raider.findUnique({
      where: { userId },
      include: { registrations: { select: { id: true, vehicle_type: true } } },
    });
    if (!rider || !rider.registrations?.length) {
      throw new NotFoundException('Rider or associated raider profile not found');
    }

    const res = await this.prisma.incentive.findMany({
      where: {
        status: IncentiveStatus.ACTIVE,
        driver_types: { some: { id: rider.registrations[0].vehicle_type.id } },
        serviceZones: {},
      },
      include: {
        ruleGroups: { include: { rules: true } },
        collected_incentives: {
          select: { id: true, userId: true, is_collected: true, incentiveId: true },
        },
      },
    });

    if (!res?.length) throw new NotFoundException('No active incentives found for this rider');
    return res;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────
  async stats() {
    const countAll = await this.prisma.incentive.count();
    const countActiveRider = await this.prisma.raider.count({ where: { raider_status: RaiderStatus.ACTIVE } });
    const agg = await this.prisma.collectedIncentive.aggregate({
      _sum: { amount: true }, _count: { id: true },
    });
    const countOngoing = await this.prisma.incentive.count({ where: { status: IncentiveStatus.ACTIVE } });

    return {
      countAll, countActiveRider, countOngoing,
      totalAmountGiven: agg._sum.amount ?? 0,
      totalCollectedIncentives: agg._count.id,
    };
  }

  // ─── Find One ──────────────────────────────────────────────────────────────
  async findOne(id: number) {
    return this.prisma.incentive.findFirst({
      where: { id },
      include: { ruleGroups: { include: { rules: true } } },
    });
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  async update(id: number, dto: UpdateIncentiveDto, adminId?: number, role?: string) {
    const rec = await this.prisma.incentive.findUnique({
      where: { id },
      include: { ruleGroups: { include: { rules: true } }, serviceZones: true },
    });
    if (!rec) throw new NotFoundException('Incentive not found');

    if (dto.start_date && new Date(dto.start_date) < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }
    if (dto.start_date && dto.end_date && new Date(dto.end_date) < new Date(dto.start_date)) {
      throw new BadRequestException('End date cannot be before start date');
    }

    this.validateSchedule(dto);
    if (dto.ruleGroups) this.validateRuleGroups(dto.ruleGroups);

    if (dto.serviceZoneIds?.length) {
      const found = await this.prisma.serviceZone.findMany({ where: { id: { in: dto.serviceZoneIds } }, select: { id: true } });
      const invalid = dto.serviceZoneIds.filter((id) => !found.map((z) => z.id).includes(id));
      if (invalid.length) throw new NotFoundException(`Invalid service zone IDs: ${invalid.join(', ')}`);
    }

    if (dto.driver_type_ids?.length) {
      const found = await this.prisma.vehicleType.findMany({ where: { id: { in: dto.driver_type_ids } }, select: { id: true } });
      const invalid = dto.driver_type_ids.filter((id) => !found.map((d) => d.id).includes(id));
      if (invalid.length) throw new NotFoundException(`Invalid driver type IDs: ${invalid.join(', ')}`);
    }

    // ── Replace rule groups atomically when provided ───────────────────────
    // Deletes all existing groups (cascades to rules), then recreates.
    if (dto.ruleGroups !== undefined) {
      await this.prisma.incentiveRuleGroup.deleteMany({ where: { incentiveId: id } });

      for (const group of dto.ruleGroups) {
        await this.prisma.incentiveRuleGroup.create({
          data: {
            incentiveId: id,
            label: group.label ?? null,
            rules: {
              createMany: {
                data: group.rules.map((rule) => ({
                  metric: rule.metric as Metric,    // ← cast: DTO string → Prisma enum
                  operator: rule.operator as Operator,  // ← cast: DTO string → Prisma enum
                  value: rule.value,
                })),
              },
            },
          },
        });
      }
    }

    const updateData: any = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.start_date !== undefined && { start_date: dto.start_date }),
      ...(dto.end_date !== undefined && { end_date: dto.end_date }),
      ...(dto.reward_type !== undefined && { reward_type: dto.reward_type }),
      ...(dto.reward_value !== undefined && { reward_value: dto.reward_value }),
      ...(dto.claim_type !== undefined && { claim_type: dto.claim_type }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.max_claim !== undefined && { max_clam: dto.max_claim }),
      ...(dto.time_constant !== undefined && { time_constant: dto.time_constant }),
      ...(dto.claim_expire !== undefined && { claim_expire: dto.claim_expire }),
      ...(dto.recurring_type !== undefined && { recurring_type: dto.recurring_type }),
      ...(dto.days_of_week !== undefined && { days_of_week: dto.days_of_week }),
      ...(dto.month !== undefined && { month: dto.month }),
      ...(dto.day_of_month !== undefined && { day_of_month: dto.day_of_month }),
      ...(dto.week_of_month !== undefined && { week_of_month: dto.week_of_month }),
      ...(adminId !== undefined && { admin: { connect: { id: adminId } } }),
      ...(dto.driver_type_ids?.length && {
        driver_types: { set: dto.driver_type_ids.map((id) => ({ id })) },
      }),
      ...(dto.serviceZoneIds?.length && {
        serviceZones: { set: dto.serviceZoneIds.map((id) => ({ id })) },
      }),
    };

    try {
      const updated = await this.prisma.incentive.update({
        where: { id },
        data: updateData,
        include: { ruleGroups: { include: { rules: true } }, serviceZones: true, driver_types: true },
      });

      await this.prisma.incentiveLog.create({
        data: {
          incentiveId: updated.id,
          incentiveData: updated,
          changedByRole: role ?? 'ADMIN',
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
    const rec = await this.prisma.incentive.findUnique({
      where: { id },
      include: { ruleGroups: { include: { rules: true } } },
    });
    if (!rec) throw new NotFoundException('Incentive not found');
    if (rec.status === dto.status) throw new BadRequestException('Incentive status is already up to date');

    const updated = await this.prisma.incentive.update({
      where: { id },
      data: { status: dto.status },
      include: { ruleGroups: { include: { rules: true } } },
    });

    await this.prisma.incentiveLog.create({
      data: {
        incentiveId: updated.id,
        incentiveData: updated,
        changedByRole: role ?? 'ADMIN',
        changedByAdminId: adminId,
      },
    });

    return updated;
  }

  // ─── Remove ────────────────────────────────────────────────────────────────
  async remove(id: number, adminId?: number, role?: string) {
    const rec = await this.prisma.incentive.findUnique({
      where: { id },
      include: { ruleGroups: { include: { rules: true } } },
    });
    if (!rec) throw new NotFoundException('Incentive not found');

    await this.prisma.incentiveLog.create({
      data: {
        incentiveId: rec.id,
        incentiveData: rec,
        changedByRole: role ?? 'ADMIN',
        changedByAdminId: adminId,
      },
    });

    return this.prisma.incentive.delete({ where: { id } });
  }

  // ─── Collect (manual) ──────────────────────────────────────────────────────
  async collect(id: number, userId: number) {
    const rec = await this.prisma.incentive.findUnique({
      where: { id },
      include: { ruleGroups: { include: { rules: true } }, serviceZones: true },
    });
    if (!rec) throw new NotFoundException('Incentive not found');
    if (rec.status === IncentiveStatus.DISABLED) {
      throw new BadRequestException('Incentive is already ended');
    }

    // ── Expiry check ────────────────────────────────────────────────────────
    if (rec.claim_expire && rec.time_constant) {
      const expireDate = new Date(rec.created_at);
      switch (rec.time_constant) {
        case 'HOURS': expireDate.setHours(expireDate.getHours() + rec.claim_expire); break;
        case 'MINUTES': expireDate.setMinutes(expireDate.getMinutes() + rec.claim_expire); break;
        case 'DAYS': expireDate.setDate(expireDate.getDate() + rec.claim_expire); break;
      }
      if (new Date() > expireDate) throw new BadRequestException('This incentive has expired');
    }

    // ── Max claim check ─────────────────────────────────────────────────────
    if (rec.max_clam) {
      const totalCollected = await this.prisma.collectedIncentive.count({
        where: { userId, incentiveId: id, is_collected: true },
      });
      if (totalCollected >= rec.max_clam) {
        throw new BadRequestException('You have reached the maximum claim limit for this incentive');
      }
    }

    if (rec.claim_type !== 'MANUAL') {
      throw new BadRequestException('This incentive is not manually claimable');
    }

    // ── Rule group check (AND within group, OR across groups) ───────────────
    // evaluateRule() is called inside userMeetsRuleGroups → evaluateGroup
    const qualifies = await this.userMeetsRuleGroups(userId, rec.ruleGroups);
    if (!qualifies) {
      throw new BadRequestException(
        'You do not meet the eligibility requirements for this incentive',
      );
    }

    // ── Reward calculation ──────────────────────────────────────────────────
    let rewardAmount = 0;
    switch (rec.reward_type) {
      case 'FIXED': rewardAmount = Number(rec.reward_value); break;
      case 'PERCENTAGE': rewardAmount = 100 * (Number(rec.reward_value) / 100); break;
      case 'POINTS': rewardAmount = Number(rec.reward_value); break;
    }

    const txId = this.txIdService.generate();

    return this.prisma.$transaction(async (tx) => {
      const collected = await tx.collectedIncentive.create({
        data: { userId, incentiveId: id, is_collected: true, amount: rewardAmount },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: {
          totalWalletBalance: { increment: rewardAmount },
          currentWalletBalance: { increment: rewardAmount },
        },
      });

      const walletHistory = await tx.walletHistory.create({
        data: {
          transactionId: txId,
          userId,
          amount: rewardAmount,
          transactionType: WalletTransactionType.EARNING,
          type: 'credit',
          status: WalletTransactionStatus.SUCCESS,
          message: `Incentive reward: ${rec.name}`,
        },
      });

      return { collectedIncentive: collected, user, walletHistory };
    });
  }

  // ─── Logs ──────────────────────────────────────────────────────────────────
  async findAllLogs(filterDto: DateByFilterDto) {
    const { fromDate, toDate, page = 1, limit = 10, search } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {
      createdAt: {
        gte: fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : undefined,
        lte: toDate ? new Date(`${toDate}T23:59:59.999Z`) : undefined,
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