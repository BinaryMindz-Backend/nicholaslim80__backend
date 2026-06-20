import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { PrismaService } from 'src/core/database/prisma.service';
import { connection } from '../queues/queue';
import { OrderStatus, StopType } from '@prisma/client';

import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';
import { RaiderGateway } from 'src/modules/raider_root/raider gateways/raider.gateway';
import { UserGateway } from 'src/modules/users_root/users/user.gateways';
import { RedisService } from 'src/modules/auth/redis/redis.service';
import { OrderService } from 'src/modules/users_root/order/order.service';
import { NotificationRuleEngineService } from 'src/modules/superadmin_root/eta/notification_role/notification_role.engine';

@Injectable()
export class CompetitionWorker implements OnModuleInit {
  private readonly logger = new Logger(CompetitionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueueService: EmailQueueService,
    private readonly raiderGateway: RaiderGateway,
    private readonly userGateway: UserGateway,
    private readonly redisService: RedisService,
    private readonly orderService: OrderService,
    private readonly ruleEngine: NotificationRuleEngineService
  ) { }

  onModuleInit() {
    const worker = new Worker(
      'order-competition',
      async (job) => {
        const orderId = job?.data?.orderId;
        this.logger.log(`[JOB START] Job ID: ${job.id} | Order ID: ${orderId}`);

        if (!orderId) {
          this.logger.warn(`[JOB SKIP] No orderId in job data. Job ID: ${job.id}`);
          return;
        }

        this.logger.log(`[COMPETITION START] Order: ${orderId}`);

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
        // logger 
        this.logger.log(`[ORDER FETCHED] Order: ${JSON.stringify({
          id: order?.id,
          competition_closed: order?.competition_closed,
          userId: order?.userId,
          compititor_id: order?.compititor_id,
          orderStopsCount: order?.orderStops?.length,
        })}`);

        if (!order) {
          this.logger.warn(`[ORDER SKIP] Order not found: ${orderId}`);
          return;
        }

        if (order.competition_closed) {
          this.logger.warn(`[ORDER SKIP] Competition already closed for order: ${orderId}`);
          return;
        }

        // DRIVERS
        const drivers: number[] = Array.isArray(order.compititor_id)
          ? order.compititor_id
          : [];

        this.logger.log(`[DRIVERS] Raw compititor_id: ${JSON.stringify(order.compititor_id)} | Type: ${typeof order.compititor_id} | Parsed drivers: ${JSON.stringify(drivers)}`);

        if (!drivers.length) {
          this.logger.warn(`[DRIVERS SKIP] No drivers found in compititor_id for order: ${orderId}`);
          return;
        }

        // PICKUP STOP
        const pickup = order.orderStops?.find((s) => s.type === 'PICKUP');

        this.logger.log(`[PICKUP] Stop found: ${JSON.stringify({
          id: pickup?.id,
          type: pickup?.type,
          latitude: pickup?.latitude,
          longitude: pickup?.longitude,
        })}`);

        if (!pickup) {
          this.logger.warn(`[PICKUP SKIP] No PICKUP stop found for order: ${orderId}`);
          return;
        }

        const pickupLat = Number(pickup.latitude);
        const pickupLng = Number(pickup.longitude);

        this.logger.log(`[PICKUP COORDS] lat: ${pickupLat} | lng: ${pickupLng} | validLat: ${!isNaN(pickupLat)} | validLng: ${!isNaN(pickupLng)}`);

        if (isNaN(pickupLat) || isNaN(pickupLng)) {
          this.logger.error(`[PICKUP ERROR] Invalid pickup coordinates for order: ${orderId}`);
          return;
        }

        // CONFIG
        const config = await this.prisma.driver_order_competition.findFirst();

        this.logger.log(`[CONFIG] ${JSON.stringify(config)}`);

        if (!config) {
          this.logger.warn(`[CONFIG SKIP] No competition config found`);
          return;
        }

        const rankWeight = Number(config.rank_weight ?? 0);
        const ratingWeight = Number(config.rating_weight ?? 0);
        const followerWeight = Number(config.followers_weight ?? 0);

        this.logger.log(`[CONFIG WEIGHTS] rankWeight: ${rankWeight} | ratingWeight: ${ratingWeight} | followerWeight: ${followerWeight}`);

        // FETCH DRIVERS
        this.logger.log(`[FETCH DRIVERS] Fetching ${drivers.length} drivers: ${JSON.stringify(drivers)}`);

        const driverDetails = await Promise.all(
          drivers.map(async (driverId) => {
            this.logger.log(`[DRIVER FETCH] Fetching raider ID: ${driverId}`);

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

            if (!raider) {
              this.logger.warn(`[DRIVER SKIP] Raider not found for ID: ${driverId}`);
              return null;
            }

            this.logger.log(`[DRIVER FOUND] Raider ID: ${driverId} | Username: ${raider.user?.username} | Tier: ${JSON.stringify(raider.tier)} | LocationObj: ${JSON.stringify(raider.locations)}`);

            const loc = raider.locations;

            if (!loc) {
              this.logger.warn(`[DRIVER SKIP] No location for raider ID: ${driverId}`);
              return null;
            }

            if (!loc.is_active) {
              this.logger.warn(`[DRIVER SKIP] Location not active for raider ID: ${driverId} | is_active: ${loc.is_active}`);
              return null;
            }

            const driverLat = Number(loc.latitude);
            const driverLng = Number(loc.longitude);

            this.logger.log(`[DRIVER COORDS] Raider ID: ${driverId} | lat: ${driverLat} | lng: ${driverLng} | validLat: ${!isNaN(driverLat)} | validLng: ${!isNaN(driverLng)}`);

            const distance = this.calculateDistance(
              pickupLat,
              pickupLng,
              driverLat,
              driverLng,
            );

            this.logger.log(`[DRIVER DISTANCE] Raider ID: ${driverId} | Distance: ${distance.toFixed(3)} km`);

            const tierScore = Number(raider.tier?.priorityScore ?? 1);
            const rating = Number(raider.reviews_count ?? 0);
            const followers = Number(raider.followers?.length ?? 0);

            this.logger.log(`[DRIVER SCORES] Raider ID: ${driverId} | tierScore: ${tierScore} | rating: ${rating} | followers: ${followers}`);

            return {
              driverId: raider.id,
              raider,
              tierScore,
              rating,
              followers,
              distance,
            };
          }),
        );


        // After driverDetails Promise.all, log raw tier data:
        this.logger.log(`[TIER CHECK] ${JSON.stringify(
          driverDetails
            .filter(Boolean)
            .map(d => ({
              id: d?.driverId,
              tier: d?.raider.tier,
              tierScore: d?.tierScore,
              distance: d?.distance,
              locLat: d?.raider.locations?.latitude,
              locLng: d?.raider.locations?.longitude,
            }))
        )}`);
        // VALID DRIVERS
        const validDrivers = driverDetails.filter(
          (d): d is NonNullable<typeof d> => d !== null,
        );

        this.logger.log(`[VALID DRIVERS] ${validDrivers.length}/${drivers.length} drivers passed validation`);
        this.logger.log(`[VALID DRIVERS LIST] ${JSON.stringify(validDrivers.map(d => ({
          id: d.driverId,
          distance: d.distance.toFixed(3),
          tierScore: d.tierScore,
          rating: d.rating,
          followers: d.followers,
        })))}`);

        if (!validDrivers.length) {
          this.logger.warn(`[VALID DRIVERS SKIP] No valid drivers for order: ${orderId}`);
          return;
        }

        // NEARBY FILTER TODO:
        // const nearbyDrivers = validDrivers.filter((d) => d.distance <= 3);
        const nearbyDrivers = validDrivers.filter(d => d.distance <= 2000000); // TODO: Disable distance filter for testings

        this.logger.log(`[NEARBY DRIVERS] ${nearbyDrivers.length}/${validDrivers.length} drivers within 3km`);
        this.logger.log(`[NEARBY DRIVERS LIST] ${JSON.stringify(nearbyDrivers.map(d => ({
          id: d.driverId,
          distance: d.distance.toFixed(3),
        })))}`);

        if (!nearbyDrivers.length) {
          this.logger.warn(`[NEARBY SKIP] No drivers within 3km for order: ${orderId}. Closest driver distance: ${Math.min(...validDrivers.map(d => d.distance)).toFixed(3)} km`);
          return;
        }

        // ELITE FILTER
        const eliteDrivers = nearbyDrivers.filter((d) => d.tierScore >= 1.5);

        this.logger.log(`[ELITE DRIVERS] ${eliteDrivers.length}/${nearbyDrivers.length} drivers with tierScore >= 1.5`);

        const candidates = eliteDrivers.length > 0 ? eliteDrivers : nearbyDrivers;

        this.logger.log(`[CANDIDATES] Using ${eliteDrivers.length > 0 ? 'ELITE' : 'NEARBY'} drivers | Total candidates: ${candidates.length}`);
        this.logger.log(`[CANDIDATES LIST] ${JSON.stringify(candidates.map(d => ({
          id: d.driverId,
          tierScore: d.tierScore,
          distance: d.distance.toFixed(3),
        })))}`);

        // SCORING
        const scored = candidates.map((d) => {
          const rawScore =
            d.tierScore * rankWeight +
            d.rating * ratingWeight +
            d.followers * followerWeight -
            d.distance * 0.1;

          const score = Number(rawScore.toFixed(3)) || 0;

          this.logger.log(`[SCORE] Raider ID: ${d.driverId} | tierScore(${d.tierScore}) * rankWeight(${rankWeight}) + rating(${d.rating}) * ratingWeight(${ratingWeight}) + followers(${d.followers}) * followerWeight(${followerWeight}) - distance(${d.distance.toFixed(3)}) * 0.1 = ${score}`);

          return { ...d, score };
        });

        scored.sort((a, b) => b.score - a.score);

        this.logger.log(`[SCORED & SORTED] ${JSON.stringify(scored.map(d => ({
          id: d.driverId,
          score: d.score,
        })))}`);

        const winner = scored[0];

        this.logger.log(`[WINNER SELECTED] Raider ID: ${winner?.driverId} | Score: ${winner?.score}`);

        if (!winner?.raider) {
          this.logger.error(`[WINNER ERROR] Winner has no raider object. Order: ${orderId}`);
          return;
        }

        const winnerRaider = winner.raider;

        const raiderName =
          winnerRaider.registrations?.[0]?.raider_name ??
          winnerRaider.user?.username ??
          'Raider';

        this.logger.log(`[WINNER DETAILS] Raider ID: ${winner.driverId} | Name: ${raiderName} | Score: ${winner.score} | Email: ${winnerRaider.registrations?.[0]?.email_address}`);

        // ASSIGN ORDER
        this.logger.log(`[DB UPDATE] Assigning order ${orderId} to raider ${winner.driverId}`);

        const [updatedOrder] = await this.prisma.$transaction([
          this.prisma.order.update({
            where: { id: orderId },
            data: {
              assign_rider_id: winner.driverId,
              competition_closed: true,
              order_status: OrderStatus.ONGOING,
              assign_at: new Date(),
            },
            include: {
              orderStops: true,
              delivery_type: true,
              user: { select: { id: true, username: true, phone: true, fcmToken: true } },
            },
          }),
          this.prisma.raider.update({
            where: { id: winner.driverId },
            data: {
              is_available: false,
            },
          }),
        ]);

        this.logger.log(`[DB UPDATE SUCCESS] Order ${orderId} assigned to raider ${winner.driverId}`);

        // ── BROADCAST: Winner gets order assigned ──
        // if (winnerRaider?.userId) {
        //   this.raiderGateway.server
        //     .to(`rider_${winnerRaider.userId}`)
        //     .emit('rider:order_assigned', {
        //       orderId: updatedOrder.id,
        //       orderNumber: `ORD-${String(updatedOrder.id).padStart(6, '0')}`,
        //       status: OrderStatus.ONGOING,
        //       message: 'Order auto-assigned to you',
        //       pickup: updatedOrder.orderStops.find((s: any) => s.type === StopType.PICKUP),
        //       drops: updatedOrder.orderStops.filter((s: any) => s.type === StopType.DROP),
        //       user: updatedOrder.user,
        //     });
        // }

        // ── BROADCAST: Other riders get fresh feed (order removed) ──
        const pickupStop = updatedOrder.orderStops.find((s: any) => s.type === StopType.PICKUP);
        if (pickupStop) {
          this.orderService.broadcastFeedToNearbyRiders(
            Number(pickupStop.latitude),
            Number(pickupStop.longitude),
            updatedOrder.delivery_type?.name ?? 'STANDARD',
          ).catch((err: any) => {
            this.logger.error(`Feed broadcast failed after auto-assign: ${err.message}`);
          });
        }

        // notification role engine for auto-assignment trigger
        await this.ruleEngine.evaluateStatus(orderId, 'ASSIGNED');

        this.logger.log(`[WINNER RAIDER FULL] ${JSON.stringify(winnerRaider)}`);

        // set to redis
        if (order.userId && order.id) {
          await this.redisService.hset(
            `rider:${winner.driverId}:active_order_users`,
            orderId.toString(),
            order?.userId.toString(),
          );
        }

        this.logger.log(
          `[REDIS] Added tracking mapping rider:${winner.driverId}:active_order_users -> ${orderId}:${order.userId}`,
        );


        // NOTIFY WINNER
        this.logger.log(`[NOTIFY] Notifying winner raider ID: ${winner.driverId}`);
        try {
          await this.raiderGateway.notifyCompetitionWon(
            winner.driverId,
            orderId,
            winner.score,
            drivers.length,
          );
          this.logger.log(`[NOTIFY SUCCESS] Winner notified: ${winner.driverId}`);
        } catch (err: any) {
          this.logger.error(`[NOTIFY ERROR] Failed to notify winner ${winner.driverId}: ${err.message}`);
        }

        // NOTIFY USER
        this.logger.log(`[NOTIFY USER] Notifying user ID: ${order.userId} about assigned raider: ${winner.driverId}`);
        try {
          await this.userGateway.notifyUserRiderAssigned(
            order.userId!,
            orderId,
            winner.driverId,
          );
          this.logger.log(`[NOTIFY USER SUCCESS] User ${order.userId} notified`);
        } catch (err: any) {
          this.logger.error(`[NOTIFY USER ERROR] Failed to notify user ${order.userId}: ${err.message}`);
        }

        // NOTIFY LOSERS
        const losers = drivers.filter((id) => id !== winner.driverId);
        this.logger.log(`[LOSERS] ${losers.length} losers to notify: ${JSON.stringify(losers)}`);

        await Promise.all(
          losers.map(async (loserId) => {
            try {
              await this.raiderGateway.notifyCompetitionLost(
                loserId,
                orderId,
                raiderName,
              );
              this.logger.log(`[LOSER NOTIFIED] Raider ID: ${loserId}`);
            } catch (err: any) {
              this.logger.error(`[LOSER NOTIFY ERROR] Raider ID: ${loserId} | Error: ${err.message}`);
            }
          }),
        );

        // EMAIL
        const reg = winnerRaider.registrations?.[0];
        this.logger.log(`[EMAIL] Winner registration: ${JSON.stringify(reg)}`);

        if (reg?.email_address) {
          try {
            await this.emailQueueService.queueOrderAssignedDriverEmail({
              driverId: winnerRaider.id,
              name: reg.raider_name ?? 'Raider',
              email: reg.email_address,
              orderId,
              raiderRank: winnerRaider.tier?.code ?? undefined,
            });
            this.logger.log(`[EMAIL QUEUED] Driver email queued for: ${reg.email_address}`);
          } catch (err: any) {
            this.logger.error(`[EMAIL ERROR] Failed to queue driver email: ${err.message}`);
          }
        } else {
          this.logger.warn(`[EMAIL SKIP] No email address for winner raider ID: ${winner.driverId}`);
        }

        if (winnerRaider.user?.fcmToken) {
          try {
            await this.emailQueueService.queueOrderAssignedNotificationRaider({
              userId: winnerRaider.user.id,
              fcmToken: winnerRaider.user.fcmToken,
              orderId,
              raiderName,
            });
            this.logger.log(`[FCM QUEUED] Push notification queued for user: ${winnerRaider.user.id}`);
          } catch (err: any) {
            this.logger.error(`[FCM ERROR] Failed to queue push notification: ${err.message}`);
          }
        } else {
          this.logger.warn(`[FCM SKIP] No FCM token for winner raider ID: ${winner.driverId}`);
        }
        // Customer notifications
        if (order.user) {
          if (order.user.fcmToken) {
            await this.emailQueueService.queueOrderAssignedNotification({
              userId: order.user.id,
              fcmToken: order.user.fcmToken,
              orderId,
              raiderName,
            });
            console.log('   ✅ Customer push notification queued');
          }

          if (order.user.email) {
            await this.emailQueueService.queueOrderAssignedUserEmail({
              userId: order.user.id,
              email: order.user.email,
              username: order.user.username ?? undefined,
              orderId,
              raiderName,
              raiderRank: winnerRaider.tier?.name,
            });
            console.log('   ✅ Customer email queued');
          }
        }

        // Loser push notifications            
        if (losers.length > 0) {
          const loserRaiders = await this.prisma.raider.findMany({
            where: { id: { in: losers }, user: { fcmToken: { not: null } } },
            select: { id: true, user: { select: { fcmToken: true } } },
          });

          const lostNotifications = loserRaiders
            .filter(raider => raider.user?.fcmToken)
            .map(raider => ({
              raiderId: raider.id,
              fcmToken: raider.user.fcmToken!,
              orderId,
            }));

          if (lostNotifications.length > 0) {
            await this.emailQueueService.queueBatchOrderLostNotifications(lostNotifications);
            console.log(`   ✅ Queued ${lostNotifications.length} loser notifications`);
          }
        }

        this.logger.log(`[COMPETITION DONE] 🏆 Winner: ${raiderName} (Raider ${winner.driverId}) | Score: ${winner.score} | Order: ${orderId}`);
      },
      {
        connection,
        concurrency: 5,
      },
    );

    worker.on('failed', (job, err) => {
      this.logger.error(`[WORKER FAILED] Job ID: ${job?.id} | Order: ${job?.data?.orderId} | Error: ${err.message} | Stack: ${err.stack}`);
    });

    worker.on('completed', (job) => {
      this.logger.log(`[WORKER COMPLETED] Job ID: ${job.id} | Order: ${job.data.orderId}`);
    });

    worker.on('error', (err) => {
      this.logger.error(`[WORKER ERROR] ${err.message} | Stack: ${err.stack}`);
    });

    this.logger.log('🚀 Competition worker running (CLEAN TIER + GPS SYSTEM)');
  }


  // DISTANCE
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

    const distance = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    this.logger.log(`[DISTANCE CALC] (${lat1}, ${lng1}) → (${lat2}, ${lng2}) = ${distance.toFixed(3)} km`);
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}