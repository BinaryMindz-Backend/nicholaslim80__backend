/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/await-thenable */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RaiderService } from './raider.service';
import { OrderService } from 'src/modules/users_root/order/order.service';
import { JwtService } from '@nestjs/jwt';
import { SocketIOAdapter } from 'src/adapters/socket-io.adapter';
import { ForbiddenException, forwardRef, Inject, Logger, } from '@nestjs/common';
import { OrderCompetitionData, OrderData } from 'src/types';
import { AutoPopupService } from '../auto_popup_services/auto-popup.service';
import { UserGateway } from 'src/modules/users_root/users/user.gateways';
import { RedisService } from 'src/modules/auth/redis/redis.service';

@WebSocketGateway({ namespace: '/raider', cors: true })
export class RaiderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RaiderGateway.name);

  @WebSocketServer()
  server!: Server;
  lastFetchTime = new Map<number, number>();

  constructor(
    private raiderService: RaiderService,
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => AutoPopupService))
    private autoPopupService: AutoPopupService,
    private readonly userGateway: UserGateway,
    private readonly redisService: RedisService,

  ) { }

  //  connect to room
  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) return client.disconnect();
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      const userId = Number(payload.sub);

      const raider = await this.raiderService.getRaiderByUserId(userId);
      if (!raider) {
        return client.disconnect();
      }

      // Fetch full details (including registrations and vehicle_type) once on connection
      const fullRaider = await this.raiderService.getRaiderById(raider.id);
      const vehicleType = fullRaider?.registrations?.[0]?.vehicle_type || null;

      client.data.user = { id: raider.id, userId: userId, raider, vehicleType };
      client.join(`rider_${raider.id}`);

      await this.raiderService.setOnline(raider.id);

      // Pre-populate/Sync active orders in Redis upon connection
      try {
        const dbOrders = await this.orderService.getActiveOrdersByRider(raider.id);

        // Clear previous list if any (to make sure it's clean)
        await this.redisService.del(`rider:${raider.id}:active_order_users`);

        if (dbOrders.length > 0) {
          for (const order of dbOrders) {
            if (order.userId) {
              await this.redisService.hset(
                `rider:${raider.id}:active_order_users`,
                order.id.toString(),
                order.userId.toString(),
              );
            }
          }
        }

        // Mark active orders cache as initialized/loaded
        await this.redisService.set(`rider:${raider.id}:active_order_users_loaded`, 'true', 3600);
      } catch (redisErr: any) {
        this.logger.error(`Error initializing active orders for rider ${raider.id}: ${redisErr.message}`);
      }

    } catch (err: any) {
      console.log('❌ Invalid token:', err.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const riderId = client.data.user?.id;
      if (riderId) {
        await this.raiderService.setOffline(riderId);
        // Clean up Redis keys to avoid memory leaks
        await this.redisService.del(`rider:${riderId}:active_order_users`);
        await this.redisService.del(`rider:${riderId}:active_order_users_loaded`);
      }
    } catch (err: any) {
      console.log('Error during disconnect:', err.message);
    }
  }

  @SubscribeMessage('rider:location')
  async handleLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { lat: number; lng: number; heading?: number },
  ) {
    const riderId = client.data.user?.id;

    if (!riderId) {
      this.logger.warn('⚠️ Location update without riderId');
      return;
    }

    try {
      // Save latest location
      await this.raiderService.updateLocation(
        riderId,
        payload.lat,
        payload.lng,
        payload.heading,
      );
      // USER LIVE TRACKING
      let activeOrders: Record<string, string> = {};

      try {
        activeOrders = await this.redisService.hgetall(
          `rider:${riderId}:active_order_users`,
        );

        const isLoaded = await this.redisService.get(
          `rider:${riderId}:active_order_users_loaded`,
        );

        // If Redis miss / not loaded yet -> fallback to DB
        if (!isLoaded && Object.keys(activeOrders).length === 0) {
          this.logger.warn(
            `[REDIS MISS] No active orders for rider ${riderId}`,
          );

          const dbOrders =
            await this.orderService.getActiveOrdersByRider(riderId);

          for (const order of dbOrders) {
            if (order.userId == null) {
              this.logger.warn(
                `[DB WARNING] Skipping active order ${order.id} with null userId`,
              );
              continue;
            }

            await this.redisService.hset(
              `rider:${riderId}:active_order_users`,
              order.id.toString(),
              order.userId.toString(),
            );

            activeOrders[order.id.toString()] =
              order.userId.toString();
          }

          await this.redisService.set(
            `rider:${riderId}:active_order_users_loaded`,
            'true',
            3600,
          );
        }
      } catch (redisError) {
        this.logger.error(
          `[REDIS ERROR] Falling back to database`,
          redisError instanceof Error
            ? redisError.stack
            : String(redisError),
        );

        const dbOrders =
          await this.orderService.getActiveOrdersByRider(riderId);

        for (const order of dbOrders) {
          if (order.userId == null) {
            this.logger.warn(
              `[DB WARNING] Skipping active order ${order.id} with null userId`,
            );
            continue;
          }

          activeOrders[order.id.toString()] =
            order.userId.toString();
        }
      }

      // Send rider location to all users in parallel
      const notifyPromises = Object.entries(activeOrders).map(([orderId, userId]) =>
        this.userGateway.notifyRiderLocation(
          Number(userId),
          Number(orderId),
          riderId,
          payload.lat,
          payload.lng,
          payload.heading,
        ),
      );
      await Promise.all(notifyPromises);

      // ADMIN LIVE MAP
      const vehicleType = client.data.user?.vehicleType;

      const io = SocketIOAdapter.getServer();

      io.of('/admin')
        .to('admin:live-map')
        .emit('admin:rider_location', {
          riderId,
          vehicle_type: vehicleType,
          ...payload,
        });

    } catch (err) {
      this.logger.error(
        `❌ Location update failed | riderId=${riderId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }



  // raider join throw socket to compition
  @SubscribeMessage('rider:join_competition')
  async handleJoinCompetition(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId: number },
  ) {
    const user = client.data.user;
    if (!user) return;

    try {
      console.log(`🏁 Rider ${user.raider.id} joining competition ${payload.orderId}`);

      const result = await this.orderService.driverCompitition(user, payload.orderId);

      // Send success response to the rider who joined
      client.emit('rider:competition_joined', {
        orderId: payload.orderId,
        success: true,
        competitorCount: result.updated?.compititor_id?.length || 0,
        autoConfirmed: result.shouldAutoConfirm,
        competitionStarted: !!result.updated.competition_started_at,
        timeRemaining: result.timeRemaining || 10,
        message: 'Successfully joined competition!',
      });

      //  BROADCAST TO ALL COMPETITORS (including the new joiner)
      if (!result.alreadyJoined && result.updated?.compititor_id) {
        const competitorIds = result.updated.compititor_id;

        console.log(`📣 Broadcasting competitor count update to ${competitorIds.length} riders`);

        // Send update to ALL riders in the competition
        for (const riderId of competitorIds) {
          this.server.to(`rider_${riderId}`).emit('rider:competitor_joined', {
            orderId: payload.orderId,
            competitorCount: competitorIds.length,
            newRiderId: user.raider.id,
            message: `${competitorIds.length} riders competing now!`,
          });
        }
      }

    } catch (err: any) {
      console.error('❌ Join error:', err.message);
      client.emit('rider:competition_error', {
        orderId: payload.orderId,
        message: err.message || 'Failed to join competition',
      });
    }
  }


  // BROADCAST NEW COMPETITION: To all riders in service zone
  async broadcastCompetitionUpdateToCompetitors(
    competitionData: OrderCompetitionData,
  ) {
    try {
      const competitorIds = competitionData.competitorIds || [];

      if (competitorIds.length === 0) {
        console.log('⚠️ No competitors to notify');
        return;
      }

      console.log(`📊 Broadcasting update to ${competitorIds.length} competitors`);
      console.log(`   Order: ${competitionData.orderId}`);
      console.log(`   Competitor count: ${competitionData.competitorCount}`);

      // Send ONLY to riders who joined
      for (const riderId of competitorIds) {
        this.server.to(`rider_${riderId}`).emit('rider:competition_update', competitionData);
      }

      console.log(`✅ Update sent to ${competitorIds.length} competitors`);

    } catch (err) {
      console.error('❌ Error broadcasting update:', err);
    }
  }

  // NOTIFY RIDER ASSIGNMENT: Winner notification
  async notifyRiderAssignment(riderId: number, orderId: number, score?: number) {
    console.log(`📢 Notifying rider ${riderId} of ASSIGNMENT to order ${orderId}`);

    this.server.to(`rider_${riderId}`).emit('rider:order_assigned', {
      orderId,
      message: '🎉 You have been assigned to this order!',
      score,
    });
  }

  // NOTIFY COMPETITION WON: Detailed winner notification
  async notifyCompetitionWon(
    riderId: number,
    orderId: number,
    score: number,
    competitorCount: number
  ) {
    console.log(`From won 🏆 Notifying rider ${riderId} - WON competition for order ${orderId}`);
    console.log(`   Score: ${score}`);
    console.log(`   Beat ${competitorCount - 1} competitors`);

    await this.server.to(`rider_${riderId}`).emit('rider:competition_won', {
      orderId,
      score,
      competitorCount,
      message: `🎉 Congratulations! You won the competition with score ${score.toFixed(2)}!`,
    });

  }

  // NOTIFY COMPETITION LOST: Loser notification
  async notifyCompetitionLost(
    riderId: number,
    orderId: number,
    winnerName: string
  ) {
    console.log(`😔 Notifying rider ${riderId} - LOST competition for order ${orderId}`);

    this.server.to(`rider_${riderId}`).emit('rider:competition_lost', {
      orderId,
      winnerName,
      message: `Order was assigned to ${winnerName}. Better luck next time!`,
    });
  }

  // Notify User fav raider
  async notifyUserFavRaider(
    riderId: number,
    orderId: number,
    userName: string,
    order: OrderData
  ) {
    console.log(` Notifying user fav rider ${riderId} - Ord No - ${orderId}`);
    this.server.to(`rider_${riderId}`).emit('rider:notify_fav_rider', {
      orderId,
      order,
      userName,
      message: `New Order request from ${userName} for ORD-${orderId}.`,
    });
  }


  @SubscribeMessage('rider:accept_popup')
  async handleAcceptPopup(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId: number },
  ) {
    const user = client.data.user;
    if (!user) return;

    const raiderId = user.raider.id;
    const { orderId } = payload;

    try {
      this.logger.log(`✅ Rider ${raiderId} accepting popup for order ${orderId}`);

      await this.autoPopupService.handleDriverAccepted(orderId, raiderId);

      // Notify user that a driver accepted their order
      const order = await this.orderService.getOrderById(orderId);
      if (order?.userId) {
        await this.userGateway.notifyUserRiderAssigned(
          order.userId,
          orderId,
          raiderId,
        );

      }

    } catch (err: any) {
      this.logger.error(`❌ Accept popup failed | rider=${raiderId} order=${orderId}`, err.message);

      client.emit('rider:popup_error', {
        orderId,
        message: err.message ?? 'Failed to accept order. It may have already been taken.',
      });
    }
  }

  // 
  @SubscribeMessage('rider:decline_popup')
  async handleDeclinePopup(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId: number; reason?: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const raiderId = user.raider.id;
    const { orderId } = payload;

    try {
      this.logger.log(`❌ Rider ${raiderId} declining popup for order ${orderId}`);

      await this.autoPopupService.handleDriverDeclined(orderId, raiderId);

      // Acknowledge decline to driver
      client.emit('rider:popup_declined_ack', {
        orderId,
        message: 'Order declined.',
      });

    } catch (err: any) {
      this.logger.error(`❌ Decline failed | rider=${raiderId} order=${orderId}`, err.message);

      client.emit('rider:popup_error', {
        orderId,
        message: err.message ?? 'Failed to process decline.',
      });
    }
  }

  // Optional but recommended — client sends this when their local timer runs out
  // Prevents driver seeing stale popup if they were offline briefly
  @SubscribeMessage('rider:popup_timeout_ack')
  async handlePopupTimeoutAck(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId: number },
  ) {
    const user = client.data.user;
    if (!user) return;

    const raiderId = user.raider.id;
    const { orderId } = payload;

    this.logger.log(`⏱ Rider ${raiderId} timed out on popup for order ${orderId}`);

    // BullMQ will handle the actual timeout — this just clears UI on client side
    client.emit('rider:popup_expired', {
      orderId,
      message: 'Popup expired. Order moved to next driver.',
    });
  }


  // Broadcast fresh feed to a specific rider
  @SubscribeMessage('rider:get_feed')
  async handleGetFeed(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { page?: number; limit?: number },
  ) {
    const user = client.data.user;
    if (!user?.userId) {
      client.emit('rider:feed_error', { message: 'Unauthorized', code: 401 });
      return;
    }

    // Throttle
    const now = Date.now();
    const lastFetch = this.lastFetchTime.get(user.userId) ?? 0;
    if (now - lastFetch < 2000) {
      client.emit('rider:feed_error', { message: 'Too many requests', code: 429 });
      return;
    }
    this.lastFetchTime.set(user.userId, now);

    try {
      const feed = await this.orderService.orderForFeed(
        user.userId,
        payload.page ?? 1,
        payload.limit ?? 100,
      );
      client.emit('rider:feed_update', feed);
    } catch (err: any) {
      client.emit('rider:feed_error', {
        message: err.message,
        code: err instanceof ForbiddenException ? 403 : 500
      });
    }
  }

  async broadcastFeedUpdate(riderId: number, feed: any) {
    this.server.to(`rider_${riderId}`).emit('rider:feed_update', feed);
  }

}
