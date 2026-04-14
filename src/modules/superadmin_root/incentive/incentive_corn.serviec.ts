// import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import {
//   WalletTransactionType,
//   WalletTransactionStatus,
//   IncentiveStatus,
//   ClaimType,
//   OrderStatus,
//   StopStatus,
//   Metric,
// } from '@prisma/client';
// import { TransactionIdService } from 'src/common/services/transaction-id.service';
// import { PrismaService } from 'src/core/database/prisma.service';

// @Injectable()
// export class IncentiveCronService {
//   private readonly logger = new Logger(IncentiveCronService.name);

//   constructor(
//     private prisma: PrismaService,
//     private txIdService: TransactionIdService,
//   ) {}

//   @Cron(CronExpression.EVERY_5_MINUTES)
//   async checkAndCollectIncentives() {
//     this.logger.log('Checking active incentives for auto-collection...');

//     const now = new Date();

//     const incentives = await this.prisma.incentive.findMany({
//       where: {
//         status: IncentiveStatus.ACTIVE,
//         claim_type: ClaimType.AUTO,
//         start_date: { lte: now },
//         end_date: { gte: now },
//       },
//       include: { rules: true },
//     });

//     // Fetch users once (important)
//     const users = await this.prisma.user.findMany({
//       where: { is_active: true, is_deleted: false },
//     });

//     for (const incentive of incentives) {
//       for (const user of users) {
//         try {
//           const alreadyCollected =
//             await this.prisma.collectedIncentive.findFirst({
//               where: {
//                 userId: user.id,
//                 incentiveId: incentive.id,
//                 is_collected: true,
//               },
//             });

//           if (alreadyCollected) continue;

//           // await here
//           if (!(await this.userMeetsRules(user, incentive.rules))) continue;

//           const rewardAmount = await this.calculateReward(incentive, user);
//           const txId = this.txIdService.generate();

//           await this.prisma.$transaction(async (tx) => {
//             await tx.collectedIncentive.create({
//               data: {
//                 userId: user.id,
//                 incentiveId: incentive.id,
//                 is_collected: true,
//                 amount: rewardAmount,
//               },
//             });

//             await tx.user.update({
//               where: { id: user.id },
//               data: {
//                 totalWalletBalance: { increment: rewardAmount },
//               },
//             });

//             await tx.walletHistory.create({
//               data: {
//                 transactionId: txId,
//                 userId: user.id,
//                 amount: rewardAmount,
//                 transactionType: WalletTransactionType.PAYMENT,
//                 type: 'credit',
//                 status: WalletTransactionStatus.SUCCESS,
//               },
//             });
//           });

//           this.logger.log(
//             `Incentive ${incentive.id} collected for user ${user.id}`,
//           );
//         } catch (error) {
//           this.logger.error(
//             `Error processing user ${user.id}: ${error.message}`,
//           );
//         }
//       }
//     }
//   }

//   // Rule checker with caching
//   private async userMeetsRules(user: any, rules: any[]): Promise<boolean> {
//     if (!rules?.length) return true;

//     const metricCache = new Map<string, number>();

//     for (const rule of rules) {
//       if (!metricCache.has(rule.metric)) {
//         const value = await this.getUserMetricValue(user, rule.metric);
//         metricCache.set(rule.metric, Number(value) || 0);
//       }

//       const userValue = metricCache.get(rule.metric);

//       if (!this.evaluateRule(userValue!, rule.operator, rule.value)) {
//         return false;
//       }
//     }

//     return true;
//   }

//   // All metrics in one place
//   private async getUserMetricValue(
//     user: any,
//     metric: string,
//   ): Promise<number> {
//     const rider = await this.prisma.raider.findFirst({
//       where: { userId: user.id, isSuspended: false },
//     });

//     if (!rider) return 0;

//     switch (metric) {
//       case Metric.COMPLETED_DELIVERIES: {
//         return this.prisma.order.count({
//           where: {
//             assign_rider_id: rider.id,
//             order_status: OrderStatus.COMPLETED,
//           },
//         });
//       }

//       case Metric.TOTAL_EARNINGS: {
//         const result = await this.prisma.walletHistory.aggregate({
//           _sum: { amount: true },
//           where: {
//             userId: user.id,
//             type: 'credit',
//             status: WalletTransactionStatus.SUCCESS,
//             transactionType: WalletTransactionType.EARNING,
//           },
//         });
//         return Number(result._sum.amount || 0);
//       }

//       case Metric.REFERRAL_COUNT:
//         return this.prisma.refer.count({
//           where: { user_id: user.id },
//         });

//       case Metric.ACCEPTED_ORDERS:
//         return this.prisma.order.count({
//           where: {
//             assign_rider_id: rider.id,
//             order_status: OrderStatus.COMPLETED,
//           },
//         });

//       case Metric.ACCEPTANCE_RATE: {
//         const orders = await this.prisma.order.findMany({
//           where: { assign_rider_id: rider.id },
//           include: { orderStops: true },
//         });

//         let completed = 0;
//         let total = 0;

//         orders.forEach((o) => {
//           total += o.orderStops.length;
//           completed += o.orderStops.filter(
//             (s) => s.status === StopStatus.COMPLETED,
//           ).length;
//         });

//         return total > 0 ? (completed / total) * 100 : 0;
//       }

//       case Metric.CONSECUTIVE_TRIPS: {
//         const orders = await this.prisma.order.findMany({
//           where: { assign_rider_id: rider.id },
//           orderBy: { created_at: 'asc' },
//           select: { order_status: true },
//         });

//         let max = 0;
//         let current = 0;

//         for (const o of orders) {
//           if (o.order_status === OrderStatus.COMPLETED) {
//             current++;
//             if (current > max) max = current;
//           } else {
//             current = 0;
//           }
//         }

//         return max;
//       }

//       case Metric.ONLINE_HOURS: {
//         const sessions = await this.prisma.raiderOnlineSession.findMany({
//           where: { raiderId: rider.id },
//           select: { startAt: true, endAt: true },
//         });

//         const hours = sessions.reduce((sum, s) => {
//           const end = s.endAt ?? new Date();
//           return sum + (end.getTime() - s.startAt.getTime()) / 3600000;
//         }, 0);

//         return Number(hours.toFixed(2));
//       }

//       default:
//         return 0;
//     }
//   }

//   private evaluateRule(
//     userValue: number,
//     operator: string,
//     targetValue: number,
//   ): boolean {
//     switch (operator) {
//       case '>=':
//         return userValue >= targetValue;
//       case '<=':
//         return userValue <= targetValue;
//       case '=':
//         return userValue === targetValue;
//       case '>':
//         return userValue > targetValue;
//       case '<':
//         return userValue < targetValue;
//       default:
//         return false;
//     }
//   }

//   // 
//   private async calculateReward(
//     incentive: any,
//     user: any,
//   ): Promise<number> {
//     switch (incentive.reward_type) {
//       case 'FIXED':
//         return Number(incentive.reward_value);

//       case 'PERCENTAGE': {
//         const earnings = await this.getUserMetricValue(
//           user,
//           Metric.TOTAL_EARNINGS,
//         );
//         return earnings * (Number(incentive.reward_value) / 100);
//       }

//       case 'POINTS':
//         return Number(incentive.reward_value);

//       default:
//         return 0;
//     }
//   }
// }


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

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Injectable()
export class IncentiveCronService {
  private readonly logger = new Logger(IncentiveCronService.name);

  constructor(
    private prisma: PrismaService,
    private txIdService: TransactionIdService,
  ) {}

  // ─── Schedule gate ──────────────────────────────────────────────────────────
  /**
   * Returns true if the incentive should fire on `now` based on its recurring_type.
   */
  private isActiveOnSchedule(incentive: any, now: Date): boolean {
    const type: RecurringType = incentive.recurring_type ?? RecurringType.ONE_TIME;

    switch (type) {
      // ── ONE_TIME: only on start_date day ──────────────────────────────────
      case RecurringType.ONE_TIME: {
        const start = new Date(incentive.start_date);
        return (
          start.getFullYear() === now.getFullYear() &&
          start.getMonth()    === now.getMonth()    &&
          start.getDate()     === now.getDate()
        );
      }

      // ── DAILY: every day within [start_date, end_date] ────────────────────
      case RecurringType.DAILY: {
        const start = new Date(incentive.start_date);
        const end   = incentive.end_date ? new Date(incentive.end_date) : null;
        start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        return now >= start && (!end || now <= end);
      }

      // ── WEEKLY: on specified days_of_week within date range ───────────────
      case RecurringType.WEEKLY: {
        const start = new Date(incentive.start_date);
        const end   = incentive.end_date ? new Date(incentive.end_date) : null;
        start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        if (now < start || (end && now > end)) return false;

        const todayDow = JS_DAY_MAP[now.getDay()];
        const allowed: DayOfWeek[] = incentive.days_of_week ?? [];
        return allowed.includes(DayOfWeek.ALL) || allowed.includes(todayDow);
      }

      // ── MONTHLY: on specific day(s) or week+day(s) of specified month ─────
      case RecurringType.MONTHLY: {
        const start = new Date(incentive.start_date);
        const end   = incentive.end_date ? new Date(incentive.end_date) : null;
        start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        if (now < start || (end && now > end)) return false;

        // Must match the configured month
        const configuredMonth: string | null = incentive.month ?? null;
        if (configuredMonth) {
          const nowMonthName = MONTH_NAMES[now.getMonth()];
          if (nowMonthName !== configuredMonth) return false;
        }

        const dayOfMonth:  number[]    = incentive.day_of_month  ?? [];
        const weekOfMonth: number[]    = incentive.week_of_month ?? [];
        const daysOfWeek:  DayOfWeek[] = incentive.days_of_week  ?? [];

        // Path 1 — day_of_month based
        if (dayOfMonth.length > 0) {
          return dayOfMonth.includes(now.getDate());
        }

        // Path 2 — week_of_month + days_of_week based
        if (weekOfMonth.length > 0 && daysOfWeek.length > 0) {
          const todayDow   = JS_DAY_MAP[now.getDay()];
          const dayMatches = daysOfWeek.includes(DayOfWeek.ALL) || daysOfWeek.includes(todayDow);
          if (!dayMatches) return false;

          // Which week of the month is today? (1-indexed)
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
        status:     IncentiveStatus.ACTIVE,
        claim_type: ClaimType.AUTO,
        start_date: { lte: now },
        // end_date filter is handled inside isActiveOnSchedule for ONE_TIME
      },
      include: { rules: true },
    });

    const users = await this.prisma.user.findMany({
      where: { is_active: true, is_deleted: false },
    });

    for (const incentive of incentives) {
      // ── Schedule gate ────────────────────────────────────────────────────
      if (!this.isActiveOnSchedule(incentive, now)) {
        this.logger.debug(`Incentive ${incentive.id} skipped — not active on schedule today`);
        continue;
      }

      for (const user of users) {
        try {
          const alreadyCollected = await this.prisma.collectedIncentive.findFirst({
            where: { userId: user.id, incentiveId: incentive.id, is_collected: true },
          });
          if (alreadyCollected) continue;

          if (!(await this.userMeetsRules(user, incentive.rules))) continue;

          const rewardAmount = await this.calculateReward(incentive, user);
          const txId         = this.txIdService.generate();

          await this.prisma.$transaction(async (tx) => {
            await tx.collectedIncentive.create({
              data: { userId: user.id, incentiveId: incentive.id, is_collected: true, amount: rewardAmount },
            });
            await tx.user.update({
              where: { id: user.id },
              data:  { totalWalletBalance: { increment: rewardAmount } },
            });
            await tx.walletHistory.create({
              data: {
                transactionId:   txId,
                userId:          user.id,
                amount:          rewardAmount,
                transactionType: WalletTransactionType.PAYMENT,
                type:            'credit',
                status:          WalletTransactionStatus.SUCCESS,
              },
            });
          });

          this.logger.log(`Incentive ${incentive.id} collected for user ${user.id}`);
        } catch (error) {
          this.logger.error(`Error processing user ${user.id}: ${error.message}`);
        }
      }
    }
  }

  // ─── Rule checker ──────────────────────────────────────────────────────────
  private async userMeetsRules(user: any, rules: any[]): Promise<boolean> {
    if (!rules?.length) return true;
    const metricCache = new Map<string, number>();

    for (const rule of rules) {
      if (!metricCache.has(rule.metric)) {
        const value = await this.getUserMetricValue(user, rule.metric);
        metricCache.set(rule.metric, Number(value) || 0);
      }
      const userValue = metricCache.get(rule.metric)!;
      if (!this.evaluateRule(userValue, rule.operator, rule.value)) return false;
    }
    return true;
  }

  // ─── Metric calculator ─────────────────────────────────────────────────────
  private async getUserMetricValue(user: any, metric: string): Promise<number> {
    const rider = await this.prisma.raider.findFirst({ where: { userId: user.id, isSuspended: false } });
    if (!rider) return 0;

    switch (metric) {
      case Metric.COMPLETED_DELIVERIES:
        return this.prisma.order.count({ where: { assign_rider_id: rider.id, order_status: OrderStatus.COMPLETED } });

      case Metric.TOTAL_EARNINGS: {
        const result = await this.prisma.walletHistory.aggregate({
          _sum:  { amount: true },
          where: { userId: user.id, type: 'credit', status: WalletTransactionStatus.SUCCESS, transactionType: WalletTransactionType.EARNING },
        });
        return Number(result._sum.amount || 0);
      }

      case Metric.REFERRAL_COUNT:
        return this.prisma.refer.count({ where: { user_id: user.id } });

      case Metric.ACCEPTED_ORDERS:
        return this.prisma.order.count({ where: { assign_rider_id: rider.id, order_status: OrderStatus.COMPLETED } });

      case Metric.ACCEPTANCE_RATE: {
        const orders = await this.prisma.order.findMany({
          where:   { assign_rider_id: rider.id },
          include: { orderStops: true },
        });
        let completed = 0, total = 0;
        orders.forEach((o) => {
          total     += o.orderStops.length;
          completed += o.orderStops.filter((s) => s.status === StopStatus.COMPLETED).length;
        });
        return total > 0 ? (completed / total) * 100 : 0;
      }

      case Metric.CONSECUTIVE_TRIPS: {
        const orders = await this.prisma.order.findMany({
          where:   { assign_rider_id: rider.id },
          orderBy: { created_at: 'asc' },
          select:  { order_status: true },
        });
        let max = 0, current = 0;
        for (const o of orders) {
          if (o.order_status === OrderStatus.COMPLETED) { current++; if (current > max) max = current; }
          else current = 0;
        }
        return max;
      }

      case Metric.ONLINE_HOURS: {
        const sessions = await this.prisma.raiderOnlineSession.findMany({
          where:  { raiderId: rider.id },
          select: { startAt: true, endAt: true },
        });
        const hours = sessions.reduce((sum, s) => {
          const end = s.endAt ?? new Date();
          return sum + (end.getTime() - s.startAt.getTime()) / 3600000;
        }, 0);
        return Number(hours.toFixed(2));
      }

      default:
        return 0;
    }
  }

  private evaluateRule(userValue: number, operator: string, targetValue: number): boolean {
    switch (operator) {
      case '>=': return userValue >= targetValue;
      case '<=': return userValue <= targetValue;
      case '=':  return userValue === targetValue;
      case '>':  return userValue >  targetValue;
      case '<':  return userValue <  targetValue;
      default:   return false;
    }
  }

  private async calculateReward(incentive: any, user: any): Promise<number> {
    switch (incentive.reward_type) {
      case 'FIXED':   return Number(incentive.reward_value);
      case 'PERCENTAGE': {
        const earnings = await this.getUserMetricValue(user, Metric.TOTAL_EARNINGS);
        return earnings * (Number(incentive.reward_value) / 100);
      }
      case 'POINTS':  return Number(incentive.reward_value);
      default:        return 0;
    }
  }
}