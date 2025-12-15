import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { connection } from '../queues/competition.queue';

const prisma = new PrismaClient();

const competitionWorker = new Worker(
  'order-competition',
  async job => {
    const { orderId } = job.data;

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.competition_closed) return;

    const drivers = order.compititor_id || [];

    // Fetch competition config
    const config = await prisma.driver_order_competition.findFirst();
    if (!config) return;

    // Calculate scores
    const scores = await Promise.all(
      drivers.map(async driverId => {
        const driver = await prisma.raider.findUnique({
          where: { id: driverId },
        //   include: { ratings: true }, // TODO: NEED to add ratings
        });

        const rank = driver?.rank || 0;
        const rating = driver?.reviews_count || 0;
        // const isFollower = driver?.isFollower ? true : false;

        return {
          driverId,
          score:
            rank * config.rank_weight +
            rating * config.rating_weight 
            // (isFollower ? config.followers_weight : 0),
        };
      }),
    );

    // Pick winner (whos scores is bigger)
    const winner = scores.sort((a, b) => b.score - a.score)[0];

    if (!winner) return;

    // Update order with winner
    await prisma.order.update({
      where: { id: orderId },
      data: {
        assign_rider_id: winner.driverId,
        competition_closed: true,
      },
    });

    console.log(`Order ${orderId} assigned to driver ${winner.driverId}`);
  },
  { connection },
);

competitionWorker.on('completed', job => {
  console.log(`Competition job ${job.id} completed`);
});

competitionWorker.on('failed', (job, err) => {
  console.error(`Competition job ${job?.id} failed:`, err);
});
