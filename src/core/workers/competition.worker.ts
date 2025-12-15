import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { PrismaService } from 'src/core/database/prisma.service';
import { connection } from '../queues/competition.queue';

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

        const scores = await Promise.all(
          drivers.map(async driverId => {
            const driver = await this.prisma.raider.findUnique({
              where: { id: driverId },
            });

            const rank = driver?.rank || 0;
            const rating = driver?.reviews_count || 0;

            return {
              driverId,
              score:
                rank * config.rank_weight +
                rating * config.rating_weight,
            };
          }),
        );

        const winner = scores.sort((a, b) => b.score - a.score)[0];
        if (!winner) return;

        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            assign_rider_id: winner.driverId,
            competition_closed: true,
          },
        });

        console.log(`✅ Order ${orderId} assigned to driver ${winner.driverId}`);
      },
      { connection },
    );
  }
}

