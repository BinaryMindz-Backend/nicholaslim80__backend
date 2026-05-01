// import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';
// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { Worker } from 'bullmq';
// import { PrismaService } from 'src/core/database/prisma.service';
// import { connection } from '../queues/competition.queue';
// import { OrderStatus, Rank } from '@prisma/client';
// import { OrderGateway } from 'src/modules/users_root/order/order.gateway';
// import { RaiderGateway } from 'src/modules/raider_root/raider gateways/raider.gateway';
// import { UserGateway } from 'src/modules/users_root/users/user.gateways';


// @Injectable()
// export class CompetitionWorker implements OnModuleInit {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly emailQueueService: EmailQueueService,
//     private readonly orderGateway: OrderGateway,
//     private readonly raiderGateway: RaiderGateway,
//     private readonly userGateway: UserGateway,
//   ) {}

//   onModuleInit() {
//     const worker = new Worker( 
//       'order-competition',
//       async job => {
//         const { orderId } = job.data;
        
//         console.log('\n⏰ ========================================');
//         console.log('⏰ COMPETITION TIMER ENDED');
//         console.log(`⏰ Order: ${orderId}`);
//         console.log('⏰ ========================================\n');

//         try {
//           // -------- STEP 1: Validate Order --------
//           console.log('📝 Step 1: Validating order...');
          
//           const order = await this.prisma.order.findUnique({
//             where: { id: orderId },
//             include: { 
//               user: {
//                 select: {
//                   id: true,
//                   email: true,
//                   username: true,
//                   fcmToken: true,
//                 }
//               }
//             },
//           });

//           if (!order) {
//             console.error('❌ Order not found');
//             return;
//           }

//           if (order.competition_closed) {
//             console.log('⚠️ Competition already closed');
//             return;
//           }

//           const drivers = order.compititor_id || [];
//           console.log(`📊 Total competitors: ${drivers.length}`);

//           // -------- STEP 2: Handle No Competitors --------
//           if (drivers.length === 0) {
//             console.log('⚠️ No competitors - closing without winner');
            
//             await this.prisma.order.update({
//               where: { id: orderId },
//               data: { competition_closed: true },
//             });
            
//             console.log('✅ Competition closed (no participants)\n');
//             return;
//           }

//           // -------- STEP 3: Get Competition Config --------
//           console.log('⚙️ Step 2: Getting competition config...');
          
//           const config = await this.prisma.driver_order_competition.findFirst();
//           if (!config) {
//             console.error('❌ Competition config not found');
//             return;
//           }
          
//           console.log(`✅ Config loaded - Rank: ${config.rank_weight}, Rating: ${config.rating_weight}`);

//           // -------- STEP 4: Fetch Driver Details --------
//           console.log('👥 Step 3: Fetching driver details...');
          
//           const driverDetails = await Promise.all(
//             drivers.map(async driverId => {
//               const driver = await this.prisma.raider.findUnique({
//                 where: { id: driverId },
//                 include: {
//                   followers: { where: { is_fav: true } },
//                   user: {
//                     select: {
//                       id: true,
//                       username: true,
//                       fcmToken: true,
//                     }
//                   },
//                   registrations: {
//                     select: {
//                       raider_name: true,
//                       email_address: true,
//                     }
//                   },
//                 },
//               });

//               if (!driver) {
//                 console.log(`⚠️ Driver ${driverId} not found`);
//                 return null;
//               }

//               console.log(`   Driver ${driverId}: Rank=${driver.rank}, Score=${driver.rankScore || 0}`);

//               return {
//                 driverId,
//                 rank: driver.rank,
//                 rankScore: driver.rankScore || 0,
//                 rating: driver.reviews_count || 0,
//                 followers: driver.followers.length || 0,
//                 raider: driver,
//               };
//             }),
//           );

//           const validDrivers = driverDetails.filter(d => d !== null);
//           console.log(`✅ Found ${validDrivers.length} valid drivers`);
          
//           if (validDrivers.length === 0) {
//             console.error('❌ No valid drivers found');
//             return;
//           }

//           // -------- STEP 5: Prioritize PLATINUM --------
//           console.log('🏆 Step 4: Selecting candidates...');
          
//           const platinumDrivers = validDrivers.filter(d => d.rank === Rank.PLATINUM);
//           const candidates = platinumDrivers.length > 0 ? platinumDrivers : validDrivers;
          
//           if (platinumDrivers.length > 0) {
//             console.log(`✅ Found ${platinumDrivers.length} PLATINUM drivers - prioritizing`);
//           } else {
//             console.log(`✅ No PLATINUM drivers - using all ${validDrivers.length}`);
//           }

//           // -------- STEP 6: Calculate Scores --------
//           console.log('🎯 Step 5: Calculating scores...');
          
//           const scores = candidates.map(d => {
//             const score =
//               d.rankScore * config.rank_weight +
//               d.rating * config.rating_weight +
//               d.followers * config.followers_weight;
            
//             console.log(`   Driver ${d.driverId}: Score = ${score.toFixed(2)}`);
            
//             return {
//               driverId: d.driverId,
//               score,
//               raider: d.raider,
//             };
//           });

//           // -------- STEP 7: Select Winner --------
//           const winner = scores.sort((a, b) => b.score - a.score)[0];
          
//           if (!winner) {
//             console.error('❌ No winner determined');
//             return;
//           }

//           console.log('\n🏆 ========================================');
//           console.log(`🏆 WINNER: Driver ${winner.driverId}`);
//           console.log(`🏆 Score: ${winner.score.toFixed(2)}`);
//           console.log('🏆 ========================================\n');

//           // -------- STEP 8: Update Order --------
//           console.log('💾 Step 6: Updating order...');
          
//           await this.prisma.order.update({
//             where: { id: orderId },
//             data: {
//               assign_rider_id: winner.driverId,
//               competition_closed: true,
//               order_status: OrderStatus.ONGOING,
//             },
//           });
          
//           console.log(`✅ Order updated - Winner: ${winner.driverId}`);

//           // -------- STEP 9: Get Winner Info --------
//           const winnerRaider = winner.raider;
//           const raiderName =
//             winnerRaider.registrations?.[0]?.raider_name ??
//             winnerRaider.user?.username ??
//             'Raider';

//           console.log(`📛 Winner name: ${raiderName}`);

//           // -------- STEP 10: WebSocket Notifications --------
//           console.log('\n📡 Step 7: Sending WebSocket notifications...');
          
//           try {
//             // Notify admin
//             // console.log('   → Notifying admin...');
//             // await this.orderGateway.broadcastOrderAssigned(orderId, winner.driverId, raiderName);
            
//             // Notify winner
//             console.log(`   → Notifying winner (Rider ${winner.driverId})...`);
//             await this.raiderGateway.notifyCompetitionWon(
//               winner.driverId,
//               orderId,
//               winner.score,
//               drivers.length,
//             );
//             // Notify user
//             console.log(`   → Notifying order User..${order.userId}`);
//             await this.userGateway.notifyUserRiderAssigned(
//                order.userId!,
//                orderId,
//                winner.driverId
//               )
//             // Notify losers
//             const losers = drivers.filter(id => id !== winner.driverId);
//             console.log(`   → Notifying ${losers.length} losers...`);
            
//             for (const loserId of losers) {
//               await this.raiderGateway.notifyCompetitionLost(loserId, orderId, raiderName);
//             }
            
//             console.log('✅ All WebSocket notifications sent');
            
//           } catch (wsError) {
//             console.error('❌ WebSocket notification error:', wsError.message);
//             console.error(wsError.stack);
//           }

//           // -------- STEP 11: Queue Email/Push Notifications --------
//           console.log('\n📧 Step 8: Queueing email/push notifications...');
          
//           try {
//             const registration = winnerRaider.registrations?.[0];

//             // Winner email
//             if (registration?.email_address) {
//               await this.emailQueueService.queueOrderAssignedDriverEmail({
//                 driverId: winnerRaider.id,
//                 name: registration.raider_name,
//                 email: registration.email_address,
//                 orderId,
//                 raiderRank: winnerRaider.rank ?? undefined,
//               });
//               console.log(`   ✅ Winner email queued: ${registration.email_address}`);
//             }

//             // Winner push
//             if (winnerRaider.user?.fcmToken) {
//               await this.emailQueueService.queueOrderAssignedNotificationRaider({
//                 userId: winnerRaider.id,
//                 fcmToken: winnerRaider.user.fcmToken,
//                 orderId,
//                 raiderName,
//               });
//               console.log('   ✅ Winner push notification queued');
//             }

//             // Customer notifications
//             if (order.user) {
//               if (order.user.fcmToken) {
//                 await this.emailQueueService.queueOrderAssignedNotification({
//                   userId: order.user.id,
//                   fcmToken: order.user.fcmToken,
//                   orderId,
//                   raiderName,
//                 });
//                 console.log('   ✅ Customer push notification queued');
//               }

//               if (order.user.email) {
//                 await this.emailQueueService.queueOrderAssignedUserEmail({
//                   userId: order.user.id,
//                   email: order.user.email,
//                   username: order.user.username ?? undefined,
//                   orderId,
//                   raiderName,
//                   raiderRank: winnerRaider.rank,
//                 });
//                 console.log('   ✅ Customer email queued');
//               }
//             }

//             // Loser push notifications
//             const losers = drivers.filter(id => id !== winner.driverId);
            
//             if (losers.length > 0) {
//               const loserRaiders = await this.prisma.raider.findMany({
//                 where: { id: { in: losers }, user: { fcmToken: { not: null } } },
//                 select: { id: true, user: { select: { fcmToken: true } } },
//               });

//               const lostNotifications = loserRaiders
//                 .filter(raider => raider.user?.fcmToken)
//                 .map(raider => ({
//                   raiderId: raider.id,
//                   fcmToken: raider.user.fcmToken!,
//                   orderId,
//                 }));

//               if (lostNotifications.length > 0) {
//                 await this.emailQueueService.queueBatchOrderLostNotifications(lostNotifications);
//                 console.log(`   ✅ Queued ${lostNotifications.length} loser notifications`);
//               }
//             }

//             console.log('✅ All email/push notifications queued');
            
//           } catch (emailError) {
//             console.error('❌ Email/push notification error:', emailError.message);
//           }

//           console.log('\n🎉 ========================================');
//           console.log('🎉 COMPETITION SUCCESSFULLY CLOSED');
//           console.log(`🎉 Order: ${orderId}`);
//           console.log(`🎉 Winner: ${raiderName} (${winner.driverId})`);
//           console.log(`🎉 Score: ${winner.score.toFixed(2)}`);
//           console.log(`🎉 Competitors: ${drivers.length}`);
//           console.log('🎉 ========================================\n');

//         } catch (error) {
//           console.error('\n❌ ========================================');
//           console.error('❌ WORKER ERROR');
//           console.error(`❌ Order: ${orderId}`);
//           console.error(`❌ Error: ${error.message}`);
//           console.error('❌ ========================================\n');
//           console.error('Stack trace:', error.stack);
//         }
//       },
//       { connection }, // ✅ Connection options
//     );

//     // ✅ Log when worker starts
//     console.log('✅ Competition worker initialized and listening...');

//     // ✅ Handle worker errors
//     worker.on('failed', (job, err) => {
//       console.error(`❌ Job ${job?.id} failed for order ${job?.data?.orderId}:`, err.message);
//     });

//     worker.on('completed', (job) => {
//       console.log(`✅ Job ${job.id} completed for order ${job.data.orderId}`);
//     });
//   }
// }



import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { PrismaService } from 'src/core/database/prisma.service';
import { connection } from '../queues/competition.queue';
import { OrderStatus } from '@prisma/client';

import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';
import { RaiderGateway } from 'src/modules/raider_root/raider gateways/raider.gateway';
import { UserGateway } from 'src/modules/users_root/users/user.gateways';

@Injectable()
export class CompetitionWorker implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueueService: EmailQueueService,
    private readonly raiderGateway: RaiderGateway,
    private readonly userGateway: UserGateway,
  ) {}

  onModuleInit() {
    const worker = new Worker(
      'order-competition',
      async (job) => {
        const orderId = job?.data?.orderId;
        if (!orderId) return;

        console.log(`\n🚀 Competition started for order ${orderId}\n`);

        // ORDER
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                fcmToken: true,
              },
            },
            orderStops: true,
          },
        });

        if (!order || order.competition_closed) return;

        const drivers: number[] = Array.isArray(order.compititor_id)
          ? order.compititor_id
          : [];

        if (!drivers.length) return;

        //  PICKUP STOP 
        const pickup = order.orderStops?.find(
          (s) => s.type === 'PICKUP',
        );

        if (!pickup) return;

        const pickupLat = Number(pickup.latitude);
        const pickupLng = Number(pickup.longitude);

        //  CONFIG
        const config =
          await this.prisma.driver_order_competition.findFirst();

        if (!config) return;

        const rankWeight = Number(config.rank_weight ?? 0);
        const ratingWeight = Number(config.rating_weight ?? 0);
        const followerWeight = Number(config.followers_weight ?? 0);
         console.log("driver details--<", config);
        //  FETCH DRIVERS 
        const driverDetails = await Promise.all(
          drivers.map(async (driverId) => {
            const raider = await this.prisma.raider.findUnique({
              where: { id: driverId },
              include: {
                tier: true,
                followers: true,
                locations: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    fcmToken: true,
                  },
                },
                registrations: {
                  select: {
                    raider_name: true,
                    email_address: true,
                  },
                },
              },
            });

            if (!raider) return null;

            const loc = raider.locations;

            if (!loc || !loc.is_active) return null;

            const distance = this.calculateDistance(
              pickupLat,
              pickupLng,
              Number(loc.latitude),
              Number(loc.longitude),
            );

            return {
              driverId: raider.id,
              raider,
              tierScore: Number(raider.tier?.priorityScore ?? 1),
              rating: Number(raider.reviews_count ?? 0),
              followers: Number(raider.followers?.length ?? 0),
              distance,
            };
          }),
        );
        console.log("driver details--<", driverDetails);
        const validDrivers = driverDetails.filter(
          (d): d is NonNullable<typeof d> => d !== null,
        );

        if (!validDrivers.length) return;

        // FILTER NEARBY 
        const nearbyDrivers = validDrivers.filter(
          (d) => d.distance <= 3,
        );

        if (!nearbyDrivers.length) return;

        //  ELITE FILTER 
        const eliteDrivers = nearbyDrivers.filter(
          (d) => d.tierScore >= 1.5,
        );

        const candidates =
          eliteDrivers.length > 0 ? eliteDrivers : nearbyDrivers;

        // SCORING 
        const scored = candidates.map((d) => {
          const score =
            d.tierScore * rankWeight +
            d.rating * ratingWeight +
            d.followers * followerWeight -
            d.distance * 0.1;

          return {
            ...d,
            score: Number(score.toFixed(3)) || 0,
          };
        });

        scored.sort((a, b) => b.score - a.score);

        const winner = scored[0];

        if (!winner?.raider) return;

        const winnerRaider = winner.raider;

        const raiderName =
          winnerRaider.registrations?.[0]?.raider_name ??
          winnerRaider.user?.username ??
          'Raider';

        // ASSIGN ORDER 
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            assign_rider_id: winner.driverId,
            competition_closed: true,
            order_status: OrderStatus.ONGOING,
          },
        });
       
       console.log('winner reaider-->', winnerRaider);

        //  NOTIFICATIONS
        // if (winnerRaider.user) {
          await this.raiderGateway.notifyCompetitionWon(
            winner.driverId,
            orderId,
            winner.score,
            drivers.length,
          );
        // }

        // if (order.user?.id && order.user?.fcmToken) {
          await this.userGateway.notifyUserRiderAssigned(
            order.userId!,
            orderId,
            winner.driverId,
          );
        // }

        const losers = drivers.filter(
          (id) => id !== winner.driverId,
        );

        for (const loserId of losers) {
          await this.raiderGateway.notifyCompetitionLost(
            loserId,
            orderId,
            raiderName,
          );
        }

        // EMAIL 
        const reg = winnerRaider.registrations?.[0];

        if (reg?.email_address) {
          await this.emailQueueService.queueOrderAssignedDriverEmail({
            driverId: winnerRaider.id,
            name: reg.raider_name ?? 'Raider',
            email: reg.email_address,
            orderId,
            raiderRank: winnerRaider.tier?.code ?? undefined,
          });
        }

        if (winnerRaider.user?.fcmToken) {
          await this.emailQueueService.queueOrderAssignedNotificationRaider(
            {
              userId: winnerRaider.user.id,
              fcmToken: winnerRaider.user.fcmToken,
              orderId,
              raiderName,
            },
          );
        }

        console.log(
          `🏆 Winner: ${raiderName} (Driver ${winner.driverId})`,
        );
      },
      {
        connection,
        concurrency: 5,
      },
    );

    worker.on('failed', (job, err) => {
      console.error(
        `❌ Competition failed for order ${job?.data?.orderId}`,
        err.message,
      );
    });

    worker.on('completed', (job) => {
      console.log(`✅ Competition completed for order ${job.data.orderId}`);
    });

    console.log('🚀 Competition worker running (CLEAN TIER + GPS SYSTEM)');
  }

    //  DISTANCE 
    private calculateDistance(
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number,
    ): number {
      const R = 6371;

      const dLat = this.deg2rad(lat2 - lat1);
      const dLng = this.deg2rad(lng2 - lng1);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(this.deg2rad(lat1)) *
          Math.cos(this.deg2rad(lat2)) *
          Math.sin(dLng / 2) ** 2;

      return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private deg2rad(deg: number): number {
      return deg * (Math.PI / 180);
    }
}