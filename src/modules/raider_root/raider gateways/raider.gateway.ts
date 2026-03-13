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
import { SocketIOAdapter } from 'src/adapters/socket-io.adapter'; // Import the adapter
import { forwardRef, Inject,  } from '@nestjs/common';
import { OrderCompetitionData, OrderData } from 'src/types';

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
    const riderId = client.data.user.id;
    
    console.log(`Received location from riderId ${riderId}:`, payload);
    
     await this.raiderService.updateLocation(
      riderId,
      payload.lat,
      payload.lng,
      payload.heading,
    );
    
    // Get ALL active orders for this rider
    // const orders = await this.orderService.getAllActiveOrdersByRider(riderId);
    
    // if (!orders || orders.length === 0) {
    //   console.log(`No active orders found for rider ${riderId}`);
    //   return;
    // }
    
    // console.log(`Found  active order(s) for rider ${riderId}`);
    
    try {
      const io = SocketIOAdapter.getServer();
      
      // Broadcast location update for EACH active order
          io.of('/admin').to('admin:live-map').emit('admin:rider_location', {
          riderId,
          lat: payload.lat,
          lng: payload.lng,
          heading: payload.heading,
        });
       }

     catch (err) {
      console.error('❌ Error broadcasting to admin:', err.message);
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

    // ⭐ BROADCAST TO ALL COMPETITORS (including the new joiner)
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
      console.log(`📢 Notifying rider ${riderId} of ASSIGNMENT to order ${orderId}`); // ✅ Fixed
      
      this.server.to(`rider_${riderId}`).emit('rider:order_assigned', { // ✅ Fixed
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
    console.log(`From won 🏆 Notifying rider ${riderId} - WON competition for order ${orderId}`); // ✅ Fixed
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
      // 
      this.server.to(`rider_${riderId}`).emit('rider:notify_fav_rider', { 
        orderId,
        order,
        userName,
        message: `New Order request from ${userName} for ORD-${orderId}.`,
      });
  } 


}
