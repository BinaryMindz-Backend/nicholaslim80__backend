// import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { WalletTransactionType, WalletTransactionStatus, IncentiveStatus } from '@prisma/client';
// import { PrismaService } from 'src/core/database/prisma.service';

// @Injectable()
// export class IncentiveCronService {
//   private readonly logger = new Logger(IncentiveCronService.name);

//   constructor(private prisma: PrismaService, private txIdService: TxIdService) {}

//   // Runs every 5 minutes
//   @Cron(CronExpression.EVERY_5_MINUTES)
//   async checkAndCollectIncentives() {
//     this.logger.log('Checking active incentives for auto-collection...');

//     const now = new Date();

//     // 1️⃣ Get active AUTO incentives
//     const incentives = await this.prisma.incentive.findMany({
//       where: {
//         status: IncentiveStatus.ACTIVE,
//         claim_type: 'AUTO',
//         start_date: { lte: now },
//         end_date: { gte: now },
//       },
//       include: { rules: true },
//     });

//     for (const incentive of incentives) {
//       // 2️⃣ Find all active users
//       const users = await this.prisma.user.findMany({ where: { isActive: true } });

//       for (const user of users) {
//         // Skip if already collected
//         const alreadyCollected = await this.prisma.collectedIncentive.findFirst({
//           where: { userId: user.id, incentiveId: incentive.id, is_collected: true },
//         });
//         if (alreadyCollected) continue;

//         // 3️⃣ Check if user meets all incentive rules
//         if (!this.userMeetsRules(user, incentive.rules)) continue;

//         // 4️⃣ Calculate reward
//         const rewardAmount = this.calculateReward(incentive, user);

//         const txId = this.txIdService.generate();

//         // 5️⃣ Transaction: collect + update wallet + history
//         await this.prisma.$transaction(async (tx) => {
//           await tx.collectedIncentive.create({
//             data: {
//               userId: user.id,
//               incentiveId: incentive.id,
//               is_collected: true,
//               amount: rewardAmount,
//             },
//           });

//           await tx.user.update({
//             where: { id: user.id },
//             data: { totalWalletBalance: { increment: rewardAmount } },
//           });

//           await tx.walletHistory.create({
//             data: {
//               transactionId: txId,
//               userId: user.id,
//               amount: rewardAmount,
//               transactionType: WalletTransactionType.PAYMENT,
//               type: 'credit',
//               status: WalletTransactionStatus.SUCCESS,
//             },
//           });
//         });

//         this.logger.log(`Auto-collected incentive ${incentive.id} for user ${user.id}`);
//       }
//     }
//   }

//   // -------------------------
//   // Check if user meets all rules
//   private userMeetsRules(user: any, rules: any[]): boolean {
//     if (!rules || rules.length === 0) return true; // no rules = everyone eligible

//     for (const rule of rules) {
//       const userMetricValue = this.getUserMetricValue(user, rule.metric);

//       if (!this.evaluateRule(userMetricValue, rule.operator, rule.value)) {
//         return false; // rule not met
//       }
//     }
//     return true; // all rules met
//   }

//   // Map metric name to user property
//   private getUserMetricValue(user: any, metric: string): number {
//     switch (metric) {
//       case 'COMPLETED_DELIVERIES':
//         return user.completedDeliveries || 0;
//       case 'TOTAL_EARNINGS':
//         return user.totalEarnings || 0;
//       case 'ACCEPTED_ORDERS':
//         return user.acceptedOrders || 0;
//       case 'ONLINE_HOURS':
//         return user.onlineHours || 0;
//       case 'ACCEPTANCE_RATE':
//         return user.acceptanceRate || 0;
//       case 'CONSECUTIVE_TRIPS':
//         return user.consecutiveTrips || 0;
//       case 'REFERRAL_COUNT':
//         return user.referralCount || 0;
//       default:
//         return 0;
//     }
//   }

//   // Evaluate rule: supports >=, <=, =, >, <
//   private evaluateRule(userValue: number, operator: string, targetValue: number): boolean {
//     switch (operator) {
//       case '>=': return userValue >= targetValue;
//       case '<=': return userValue <= targetValue;
//       case '=':  return userValue === targetValue;
//       case '>':  return userValue > targetValue;
//       case '<':  return userValue < targetValue;
//       default:   return false;
//     }
//   }

//   // Calculate reward based on reward_type
//   private calculateReward(incentive: any, user: any): number {
//     switch (incentive.reward_type) {
//       case 'FIXED':
//         return Number(incentive.reward_value);
//       case 'PERCENTAGE':
//         // Example: % of total earnings
//         return (user.totalEarnings || 0) * (Number(incentive.reward_value) / 100);
//       case 'POINTS':
//         return Number(incentive.reward_value);
//       default:
//         return 0;
//     }
//   }
// }