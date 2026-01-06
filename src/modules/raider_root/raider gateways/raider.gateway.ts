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

@WebSocketGateway({ namespace: '/raider', cors: true })
export class RaiderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private raiderService: RaiderService,
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

  // @SubscribeMessage('rider:location')
  // async handleLocation(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() payload: { lat: number; lng: number; heading?: number },
  // ) {
  //   const riderId = client.data.user.id;
    
  //   console.log(`Received location from riderId ${riderId}:`, payload);
    
  //   await this.raiderService.updateLocation(
  //     riderId,
  //     payload.lat,
  //     payload.lng,
  //     payload.heading,
  //   );
    
  //   const order = await this.orderService.getActiveOrderByRider(riderId);
  //   if (!order) {
  //     console.log(`No active order found for rider ${riderId}`);
  //     return;
  //   }
    
  //   console.log(`Broadcasting location to admin for order ${order.id}`);
    
  //   try {
  //     // Get the Socket.IO server from the adapter
  //     const io = SocketIOAdapter.getServer();
      
  //     // Broadcast to admin namespace
  //     io.of('/admin').to('admin:live-map').emit('admin:rider_location', {
  //       orderId: order.id,
  //       riderId,
  //       lat: payload.lat,
  //       lng: payload.lng,
  //       heading: payload.heading,
  //     });
      
  //     console.log(`✅ Broadcasted to admin namespace`);
  //   } catch (err) {
  //     console.error('❌ Error broadcasting to admin:', err.message);
  //   }
  // }
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
}
