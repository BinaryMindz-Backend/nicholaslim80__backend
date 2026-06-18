import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  WalletTransactionType,
  WalletTransactionStatus,
  IncentiveStatus,
  ClaimType,
  OrderStatus,
  StopStatus,
  Metric,
  DayOfWeek,
  RecurringType,
  Operator,
} from '@prisma/client';
import { TransactionIdService } from 'src/common/services/transaction-id.service';
import { PrismaService } from 'src/core/database/prisma.service';

// Map JS getDay() → DayOfWeek enum
const JS_DAY_MAP: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUN,
  1: DayOfWeek.MON,
  2: DayOfWeek.TUE,
  3: DayOfWeek.WED,
  4: DayOfWeek.THURS,
  5: DayOfWeek.FRI,
  6: DayOfWeek.SAT,
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

@Injectable()
export class IncentiveCronService {
  private readonly logger = new Logger(IncentiveCronService.name);

  constructor(
    private prisma: PrismaService,
    private txIdService: TransactionIdService,
  ) { }

  // ─── Schedule gate ──────────────────────────────────────────────────────────
  private isActiveOnSchedule(incentive: any, now: Date): boolean {
    const type: RecurringType = incentive.recurring_type ?? RecurringType.ONE_TIME;

    switch (type) {
      case RecurringType.ONE_TIME: {
        const start = new Date(incentive.start_date);
        return (
          start.getFullYear() === now.getFullYear() &&
          start.getMonth() === now.getMonth() &&
          start.getDate() === now.getDate()
        );
      }

      case RecurringType.DAILY: {
        const start = new Date(incentive.start_date);
        const end = incentive.end_date ? new Date(incentive.end_date) : null;
        start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        return now >= start && (!end || now <= end);
      }

      case RecurringType.WEEKLY: {
        const start = new Date(incentive.start_date);
        const end = incentive.end_date ? new Date(incentive.end_date) : null;
        start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        if (now < start || (end && now > end)) return false;

        const todayDow = JS_DAY_MAP[now.getDay()];
        const allowed: DayOfWeek[] = incentive.days_of_week ?? [];
        return allowed.includes(DayOfWeek.ALL) || allowed.includes(todayDow);
      }

      case RecurringType.MONTHLY: {
        const start = new Date(incentive.start_date);
        const end = incentive.end_date ? new Date(incentive.end_date) : null;
        start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        if (now < start || (end && now > end)) return false;

        const configuredMonth: string | null = incentive.month ?? null;
        if (configuredMonth) {
          const nowMonthName = MONTH_NAMES[now.getMonth()];
          if (nowMonthName !== configuredMonth) return false;
        }

        const dayOfMonth: number[] = incentive.day_of_month ?? [];
        const weekOfMonth: number[] = incentive.week_of_month ?? [];
        const daysOfWeek: DayOfWeek[] = incentive.days_of_week ?? [];

        if (dayOfMonth.length > 0) {
          return dayOfMonth.includes(now.getDate());
        }

        if (weekOfMonth.length > 0 && daysOfWeek.length > 0) {
          const todayDow = JS_DAY_MAP[now.getDay()];
          const dayMatches = daysOfWeek.includes(DayOfWeek.ALL) || daysOfWeek.includes(todayDow);
          if (!dayMatches) return false;
          const weekNum = Math.ceil(now.getDate() / 7);
          return weekOfMonth.includes(weekNum);
        }

        return false;
      }

      default:
        return false;
    }
  }

  // ─── Main cron ─────────────────────────────────────────────────────────────
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAndCollectIncentives() {
    this.logger.log('Checking active incentives for auto-collection...');
    const now = new Date();

    const incentives = await this.prisma.incentive.findMany({
      where: {
        status: IncentiveStatus.ACTIVE,
        claim_type: ClaimType.AUTO,
        start_date: { lte: now },
      },
      include: {
        ruleGroups: {
          include: { rules: true },
        },
      },
    });

    const users = await this.prisma.user.findMany({
      where: { is_active: true, is_deleted: false },
    });

    for (const incentive of incentives) {
      if (!this.isActiveOnSchedule(incentive, now)) {
        this.logger.debug(
          `Incentive ${incentive.id} skipped — not active on schedule today`,
        );
        continue;
      }

      for (const user of users) {
        try {
          const alreadyCollected = await this.prisma.collectedIncentive.findFirst({
            where: {
              userId: user.id,
              incentiveId: incentive.id,
              is_collected: true,
            },
          });
          if (alreadyCollected) continue;

          // ── Group-level AND / OR evaluation ───────────────────────────────
          // OR across groups: at least ONE group must fully pass.
          // AND within a group: ALL rules in the group must pass.
          const qualifies = await this.userMeetsRuleGroups(
            user,
            incentive.ruleGroups,
          );
          if (!qualifies) continue;

          const rewardAmount = await this.calculateReward(incentive, user);
          const txId = this.txIdService.generate();

          await this.prisma.$transaction(async (tx) => {
            await tx.collectedIncentive.create({
              data: {
                userId: user.id,
                incentiveId: incentive.id,
                is_collected: true,
                amount: rewardAmount,
              },
            });

            await tx.user.update({
              where: { id: user.id },
              data: {
                totalWalletBalance: { increment: rewardAmount },
                currentWalletBalance: { increment: rewardAmount },
              },
            });

            await tx.walletHistory.create({
              data: {
                transactionId: txId,
                userId: user.id,
                amount: rewardAmount,
                transactionType: WalletTransactionType.EARNING,
                type: 'credit',
                status: WalletTransactionStatus.SUCCESS,
                message: `Incentive reward: ${incentive.name}`,
              },
            });
          });

          this.logger.log(
            `Incentive ${incentive.id} collected for user ${user.id}`,
          );
        } catch (error: any) {
          this.logger.error(
            `Error processing user ${user.id}: ${error.message}`,
          );
        }
      }
    }
  }

  // ─── Group-level evaluator (OR across groups) ──────────────────────────────
  /**
   * Returns true if the user satisfies AT LEAST ONE rule group.
   * If no groups are defined the incentive has no restrictions → qualifies.
   *
   * Example:
   *   Group A: [deliveries >= 10] AND [acceptance_rate >= 90]
   *   Group B: [total_earnings >= 5000]
   *
   *   User qualifies if Group A passes OR Group B passes.
   */
  async userMeetsRuleGroups(
    user: any,
    ruleGroups: any[],
  ): Promise<boolean> {
    if (!ruleGroups || ruleGroups.length === 0) return true;

    // Shared metric cache across all groups — avoids duplicate DB queries
    const metricCache = new Map<string, number>();

    for (const group of ruleGroups) {
      const groupPasses = await this.evaluateGroup(
        user,
        group.rules ?? [],
        metricCache,
      );
      if (groupPasses) return true;
    }

    return false;
  }

  // ─── Single-group evaluator (AND within group) ─────────────────────────────
  private async evaluateGroup(
    user: any,
    rules: any[],
    metricCache: Map<string, number>,
  ): Promise<boolean> {
    if (!rules || rules.length === 0) return true;

    for (const rule of rules) {
      if (!metricCache.has(rule.metric)) {
        const value = await this.getUserMetricValue(user, rule.metric);
        metricCache.set(rule.metric, Number(value) || 0);
      }

      const userValue = metricCache.get(rule.metric)!;

      if (!this.evaluateRule(userValue, rule.operator, Number(rule.value))) {
        return false; // AND — one failure fails the whole group
      }
    }

    return true;
  }

  // ─── Single-rule evaluator ─────────────────────────────────────────────────
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

  // ─── Metric calculator ─────────────────────────────────────────────────────
  private async getUserMetricValue(user: any, metric: string): Promise<number> {
    const rider = await this.prisma.raider.findFirst({
      where: { userId: user.id, isSuspended: false },
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
            userId: user.id,
            type: 'credit',
            status: WalletTransactionStatus.SUCCESS,
            transactionType: WalletTransactionType.EARNING,
          },
        });
        return Number(result._sum.amount ?? 0);
      }

      case Metric.REFERRAL_COUNT:
        return this.prisma.refer.count({ where: { user_id: user.id } });

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

  // ─── Reward calculator ─────────────────────────────────────────────────────
  private async calculateReward(incentive: any, user: any): Promise<number> {
    switch (incentive.reward_type) {
      case 'FIXED':
        return Number(incentive.reward_value);

      case 'PERCENTAGE': {
        const earnings = await this.getUserMetricValue(user, Metric.TOTAL_EARNINGS);
        return earnings * (Number(incentive.reward_value) / 100);
      }

      case 'POINTS':
        return Number(incentive.reward_value);

      default:
        return 0;
    }
  }
}