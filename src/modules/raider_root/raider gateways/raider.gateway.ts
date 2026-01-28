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
import { SocketIOAdapter } from 'src/adapters/socket-io.adapter'; // Import the adapter
import { forwardRef, Inject } from '@nestjs/common';
import { OrderCompetitionData } from 'src/types';

@WebSocketGateway({ namespace: '/raider', cors: true })
export class RaiderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private raiderService: RaiderService,
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) return client.disconnect();
    
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      const userId = Number(payload.sub);
      console.log("user id", userId);
      
      const raider = await this.raiderService.getRaiderByUserId(userId);
      console.log("raider result:", raider);
      
      if (!raider) {
        console.log('Raider not found for user:', userId);
        return client.disconnect();
      }
      
      client.data.user = { id: raider.id, userId: userId, raider };
      console.log('Rider connected - userId:', userId, 'raiderId:', raider.id);
      
      await this.raiderService.setOnline(raider.id);
    } catch (err) {
      console.log('Invalid token', err.message);
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
    const riderId = client.data.user.id;
    
    console.log(`Received location from riderId ${riderId}:`, payload);
    
    await this.raiderService.updateLocation(
      riderId,
      payload.lat,
      payload.lng,
      payload.heading,
    );
    
    // Get ALL active orders for this rider
    const orders = await this.orderService.getAllActiveOrdersByRider(riderId);
    
    if (!orders || orders.length === 0) {
      console.log(`No active orders found for rider ${riderId}`);
      return;
    }
    
    console.log(`Found ${orders.length} active order(s) for rider ${riderId}`);
    
    try {
      const io = SocketIOAdapter.getServer();
      
      // Broadcast location update for EACH active order
      for (const order of orders) {
        io.of('/admin').to('admin:live-map').emit('admin:rider_location', {
          orderId: order.id,
          riderId,
          lat: payload.lat,
          lng: payload.lng,
          heading: payload.heading,
        });
        
        console.log(`✅ Broadcasted to admin namespace for order ${order.id}`);
      }
    } catch (err) {
      console.error('❌ Error broadcasting to admin:', err.message);
    }
  }
  
  // RIDER JOINS COMPETITION (via WebSocket or REST API)
  @SubscribeMessage('rider:join_competition')
  async handleJoinCompetition(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId: number },
  ) {
    const user = client.data.user;
    if (!user) {
      console.log('❌ No user data in socket');
      return;
    }
    
    try {
      console.log(`🏁 Rider ${user.raider.id} joining competition for order ${payload.orderId}`);
      
      // Call your existing service method
      const result = await this.orderService.driverCompitition(user, payload.orderId);
      
      // Notify rider of successful join
      client.emit('rider:competition_joined', {
        orderId: payload.orderId,
        success: true,
        competitorCount: result.updated?.compititor_id?.length || 0,
        autoConfirmed: result.shouldAutoConfirm,
        message: 'Successfully joined competition!',
      });
      
      console.log(`✅ Rider ${user.raider.id} successfully joined competition`);
      
    } catch (err) {
      console.error('❌ Error joining competition:', err.message);
      
      // Notify rider of error
      client.emit('rider:competition_error', {
        orderId: payload.orderId,
        message: err.message || 'Failed to join competition',
      });
    }
  }

  // SEND ACTIVE COMPETITIONS: When rider connects
  // private async sendActiveCompetitions(client: Socket, riderId: number) {
  //   try {
  //     const competitions = await this.orderService.getActiveCompetitionsForRider(riderId);
      
  //     console.log(`📤 Sending ${competitions.length} active competitions to rider ${riderId}`);
      
  //     client.emit('rider:active_competitions', competitions);
  //   } catch (err) {
  //     console.error('❌ Error sending active competitions:', err);
  //   }
  // }

  // BROADCAST NEW COMPETITION: To all riders in service zone
  async broadcastNewCompetitionToZone(
    competitionData: OrderCompetitionData,
  ) {
    try {
      // Get all online riders in the zone with matching vehicle
      const riders = await this.raiderService.getOnlineRidersInZone(competitionData.competitorIds);
      
      console.log(`📣 Broadcasting NEW COMPETITION to ${riders.length} riders in zone ${competitionData.serviceZoneId}`);
      console.log(`   Order: ${competitionData.orderId}`);
      console.log(`   Duration: ${competitionData.timeRemaining}s`);
      
      // Send to each rider's room
      for (const rider of riders) {
        this.server.to(`rider:${rider.id}`).emit('rider:new_competition', competitionData);
      }
      
      console.log(`✅ Competition broadcast sent to ${riders.length} riders`);
      
    } catch (err) {
      console.error('❌ Error broadcasting competition:', err);
    }
  }

  // NOTIFY RIDER ASSIGNMENT: Winner notification
  async notifyRiderAssignment(riderId: number, orderId: number, score?: number) {
    console.log(`📢 Notifying rider ${riderId} of ASSIGNMENT to order ${orderId}`);
    
   await this.server.to(`rider:${riderId}`).emit('rider:order_assigned', {
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
    console.log(`🏆 Notifying rider ${riderId} - WON competition for order ${orderId}`);
    console.log(`   Score: ${score}`);
    console.log(`   Beat ${competitorCount - 1} competitors`);
    
    await this.server.to(`rider:${riderId}`).emit('rider:competition_won', {
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
    
   await this.server.to(`rider:${riderId}`).emit('rider:competition_lost', {
      orderId,
      winnerName,
      message: `Order was assigned to ${winnerName}. Better luck next time!`,
    });
  }
 


}
