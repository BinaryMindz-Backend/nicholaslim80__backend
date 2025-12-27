import { NotificationService } from './../../modules/superadmin_root/notification/notification.service';
import { MailService } from 'src/common/services/mail.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { PrismaService } from 'src/core/database/prisma.service';
import { connection } from '../queues/competition.queue';
import { NotificationType, OrderStatus, Rank } from '@prisma/client';

@Injectable()
export class CompetitionWorker implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService:MailService,
    private readonly notify:NotificationService  
  ) {}

  onModuleInit() {
    new Worker(
      'order-competition',
      async job => {
        const { orderId } = job.data;
        console.log('🚀 Worker running for order:', orderId);

        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!order || order.competition_closed) return;

        const drivers = order.compititor_id || [];
        if (drivers.length === 0) return;

        const config = await this.prisma.driver_order_competition.findFirst();
        if (!config) return;
         // 
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

        if (validDrivers.length === 0) return;

        //  Prioritize PLATINUM drivers
        const platinumDrivers = validDrivers.filter(d => d.rank === Rank.PLATINUM);

        // If no PLATINUM, fallback to all drivers
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
        if (!winner) return;
        // 
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            assign_rider_id: winner.driverId,
            competition_closed: true,
            order_status:OrderStatus.ONGOING
          },
        });
           //send notification and email
              const winnerRaider = await this.prisma.raider.findUnique({
                  where: { id: winner.driverId },
                  include: {
                    user: true, // email, fcmToken
                    registrations:true
                  },
                });

                if (!winnerRaider || !winnerRaider.user) return;

                const notificationTitle = '🎉 Order Assigned!';
                const notificationMessage = `You won the order #${orderId}. Please start delivery.`;

                // PUSH NOTIFICATION
                await this.notify.sendNotificationByType(
                  NotificationType.PUSH_NOTIFICATION,
                  [
                    {
                      fcmToken: winnerRaider.user.fcmToken ?? undefined,
                    },
                  ],
                  notificationTitle,
                  notificationMessage,
                );
                // send mail
                await this.mailService.sendMail({
                      to: winnerRaider.user.email!,
                      subject: '🎉 Order Assigned!',
                      templateName: 'order-competition',
                      context: {
                        name: winnerRaider.registrations[0].raider_name ?? 'Rider',
                        orderId,
                        rank: winnerRaider.rank,
                      },
                    });

                // Sent to lossers
                const losers = drivers.filter(id => id !== winner.driverId);

                    await Promise.all(
                      losers.map(async raiderId => {
                        const raider = await this.prisma.raider.findUnique({
                          where: { id: raiderId },
                          include: { user: true },
                        });

                        if (!raider?.user?.fcmToken) return;

                        await this.notify.sendNotificationByType(
                          NotificationType.PUSH_NOTIFICATION,
                          [{ fcmToken: raider.user.fcmToken }],
                          'Order Taken',
                          'Another rider won this order. Keep trying!',
                        );
                      }),
                    );
                    

        console.log(`✅ Order ${orderId} assigned to driver ${winner.driverId}`);
      },
      { connection },
    );
  }
}

