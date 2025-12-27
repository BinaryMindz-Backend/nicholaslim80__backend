import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { PrismaService } from 'src/core/database/prisma.service';
import { connection } from '../queues/competition.queue';
import { OrderStatus, Rank } from '@prisma/client';

@Injectable()

export class CompetitionWorker implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueueService: EmailQueueService, // Fixed: Use correct casing
  ) {}

  onModuleInit() {
    new Worker(
      'order-competition',
      async job => {
        const { orderId } = job.data;
        console.log('🚀 Worker running for order:', orderId);

        // 1. VALIDATE ORDER
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!order || order.competition_closed) {
          console.log(`⚠️ Order ${orderId} is invalid or already closed`);
          return;
        }

        const drivers = order.compititor_id || [];
        if (drivers.length === 0) {
          console.log(`⚠️ No competitors for order ${orderId}`);
          return;
        }

        // 2. GET COMPETITION CONFIG
        const config = await this.prisma.driver_order_competition.findFirst();
        if (!config) {
          console.log(`⚠️ No competition config found`);
          return;
        }

        // 3. FETCH & SCORE DRIVERS
        const driverDetails = await Promise.all(
          drivers.map(async driverId => {
            const driver = await this.prisma.raider.findUnique({
              where: { id: driverId },
              include: {
                followers: { where: { is_fav: true } },
              },
            });

            return driver
              ? {
                  driverId,
                  rank: driver.rank,
                  rankScore: driver.rankScore || 0,
                  rating: driver.reviews_count || 0,
                  followers: driver.followers.length || 0,
                }
              : null;
          }),
        );

        const validDrivers = driverDetails.filter(d => d !== null);

        if (validDrivers.length === 0) {
          console.log(`⚠️ No valid drivers for order ${orderId}`);
          return;
        }

        // Prioritize PLATINUM drivers
        const platinumDrivers = validDrivers.filter(d => d.rank === Rank.PLATINUM);
        const candidates = platinumDrivers.length > 0 ? platinumDrivers : validDrivers;

        // Calculate weighted scores
        const scores = candidates.map(d => ({
          driverId: d.driverId,
          score:
            d.rankScore * config.rank_weight +
            d.rating * config.rating_weight +
            d.followers * config.followers_weight,
        }));

        const winner = scores.sort((a, b) => b.score - a.score)[0];
        
        if (!winner) {
          console.log(`⚠️ No winner determined for order ${orderId}`);
          return;
        }

        // 4. UPDATE ORDER WITH WINNER
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            assign_rider_id: winner.driverId,
            competition_closed: true,
            order_status: OrderStatus.ONGOING,
          },
        });

        console.log(`✅ Order ${orderId} assigned to driver ${winner.driverId}`);

        // 5. SEND NOTIFICATIONS (NON-BLOCKING)
        
          // Get winner details
          const winnerRaider = await this.prisma.raider.findUnique({
            where: { id: winner.driverId },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  fcmToken: true,
                },
              },
              registrations: {
                select: {
                  raider_name: true,
                  email_address: true,
                  contact_number: true,
                },
              },
            },
          });
            

        // Get order creator
        const orderCreator = await this.prisma.user.findUnique({
          where: { id: order.userId as number },
          select: { id: true, email: true, username: true, fcmToken: true },
        });
         //
          if (!winnerRaider) {
            return;
          }

          // Safely extract registration info
          const registration = winnerRaider.registrations?.[0];
          const raiderName =
            registration?.raider_name ??
            winnerRaider.user?.username ??
            'Raider';

          // 📧 EMAIL NOTIFICATION (Winner)
          if (registration?.email_address) {
            await this.emailQueueService.queueOrderAssignedDriverEmail({
              driverId: winnerRaider.id,
              name:registration.raider_name,
              email: registration.email_address,
              orderId,
              raiderRank: winnerRaider.rank ?? undefined,
            });

            console.log(`📧 Email queued for raider ${registration.email_address}`);
          }

          // 📱 PUSH NOTIFICATION (Winner)
          if (winnerRaider.user?.fcmToken) {
            await this.emailQueueService.queueOrderAssignedNotificationRaider({
              userId: winnerRaider.id,
              fcmToken: winnerRaider.user.fcmToken,
              orderId,
              raiderName,
            });

            console.log(`📱 Push notification queued for raider ${winnerRaider.id}`);
          }

        // QUEUE NOTIFICATIONS FOR ORDER CREATOR
        if (orderCreator) {
          const raiderName = winnerRaider?.registrations[0]?.raider_name ?? 'a rider';

          // Queue push notification
          if (orderCreator.fcmToken) {
            await this.emailQueueService.queueOrderAssignedNotification({
              userId: orderCreator.id,
              fcmToken: orderCreator.fcmToken,
              orderId,
              raiderName,
            });
            console.log(`📧 Push notification queued for user ${orderCreator.id}`);
          }

          // Queue email
          if (orderCreator.email) {
            await this.emailQueueService.queueOrderAssignedUserEmail({
              userId: orderCreator.id,
              email: orderCreator.email,
              username: orderCreator.username ?? undefined,
              orderId,
              raiderName,
              raiderRank: winnerRaider?.rank,
            });
            console.log(`📧 Email queued for user ${orderCreator.email}`);
          }
        }

        // QUEUE BATCH NOTIFICATIONS FOR LOSER RAIDERS
        const losers = drivers.filter(id => id !== winner.driverId);

        if (losers.length > 0) {
          // Fetch all loser raiders with fcmTokens in one query (OPTIMIZED)
          const loserRaiders = await this.prisma.raider.findMany({
            where: {
              id: { in: losers },
              user: {
                fcmToken: { not: null },
              },
            },
            select: {
              id: true,
              user: {
                select: {
                  fcmToken: true,
                },
              },
            },
          });

          // Prepare batch notifications
          const lostNotifications = loserRaiders
            .filter(raider => raider.user?.fcmToken)
            .map(raider => ({
              raiderId: raider.id,
              fcmToken: raider.user.fcmToken!,
              orderId,
            }));

          // Queue all lost notifications in batch (OPTIMIZED)
          if (lostNotifications.length > 0) {
            const result = await this.emailQueueService.queueBatchOrderLostNotifications(
              lostNotifications
            );
            console.log(
              `📧 Queued ${result?.successful ?? 0} loser notifications for order ${orderId}`
            );
          }
        }

        console.log(`🎉 All notifications queued for order ${orderId}`);
      },
      { connection },
    );
  }
}

