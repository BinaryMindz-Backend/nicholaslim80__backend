import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { PrismaService } from 'src/core/database/prisma.service';
import { connection } from '../queues/competition.queue';
import { OrderStatus, Rank } from '@prisma/client';

@Injectable()
export class CompetitionWorker implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

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
        // TODO:need to send notification and email
        console.log(`✅ Order ${orderId} assigned to driver ${winner.driverId}`);
      },
      { connection },
    );
  }
}

