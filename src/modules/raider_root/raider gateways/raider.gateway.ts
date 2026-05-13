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
import { forwardRef, Inject, Logger,  } from '@nestjs/common';
import { OrderCompetitionData, OrderData } from 'src/types';
import { AutoPopupService } from '../auto_popup_services/auto-popup.service';
import { UserGateway } from 'src/modules/users_root/users/user.gateways';

@WebSocketGateway({ namespace: '/raider', cors: true })
export class RaiderGateway implements OnGatewayConnection, OnGatewayDisconnect {
   private readonly logger = new Logger(RaiderGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private raiderService: RaiderService,
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => AutoPopupService))
    private autoPopupService: AutoPopupService,
    private readonly userGateway: UserGateway, 

  ) {}

    //  connect to room
   async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) return client.disconnect();
    
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      const userId = Number(payload.sub);
      
      const raider = await this.raiderService.getRaiderByUserId(userId);
      if (!raider) {
        console.log('❌ Raider not found:', userId);
        return client.disconnect();
      }
       
       client.data.user = { id: raider.id, userId: userId, raider };
        console.log('Rider connected - userId:', userId, 'raiderId:', raider.id);
        client.join(`rider_${raider.id}`);
      
      console.log(`✅ Rider connected: ${raider.id}`);
      await this.raiderService.setOnline(raider.id);
      
    } catch (err) {
      console.log('❌ Invalid token:', err.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const riderId = client.data.user?.id;
      if (riderId) {
        console.log('Rider disconnecting:', riderId);
        await this.raiderService.setOffline(riderId);
        console.log('Rider set offline:', riderId);
      }
    } catch (err) {
      console.log('Error during disconnect:', err.message);
    }
  }
  
    // update loaction in every move
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

      // this.logger.debug(
      //   `📍 Location update | riderId=${riderId} | ${payload.lat},${payload.lng}`,
      // );

      try {
         await this.raiderService.updateLocation(
          riderId,
          payload.lat,
          payload.lng,
          payload.heading,
        );

        // this.logger.debug(`💾 DB updated | riderId=${riderId}`);

        const io = SocketIOAdapter.getServer();

        io.of('/admin')
          .to('admin:live-map')
          .emit('admin:rider_location', {
            riderId,
            ...payload,
          });

        // this.logger.log(`📡 Broadcasted location | riderId=${riderId}`);
      } catch (err) {
        this.logger.error(
          `❌ Location update failed | riderId=${riderId}`,
          err.stack,
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
      
    } catch (err) {
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
      riderId:number,
      orderId:number,
      userName:string,
      order:OrderData
  ){
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

    } catch (err) {
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

    } catch (err) {
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

  
}
