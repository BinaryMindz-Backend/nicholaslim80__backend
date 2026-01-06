import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection,
  SubscribeMessage,
  ConnectedSocket 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OrderService } from './order.service';
import { RedisService } from 'src/modules/auth/redis/redis.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/guards/ws-jwt.guard';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/admin' })
@UseGuards(WsJwtGuard)
export class OrderGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private redisService: RedisService, 
    private orderService: OrderService
  ) {}

  async handleConnection(client: Socket) {
    console.log('Admin connected:', client.id);
    client.join('admin:live-map');
    
    // Send initial data
    await this.sendAllOrdersWithLocations(client);
  }

 private async sendAllOrdersWithLocations(client: Socket) {
  const activeOrders = await this.orderService.getAllActiveOrders();
  console.log("active order -->", activeOrders);
  
  // Add explicit type definition here
  const ordersWithLocation: Array<{
    orderId: number;
    riderId: number;
    assign_rider: {
      locations: {
        lat: any;
        lng: any;
        heading?: any;
      }
    };
    orderStatus: any;
  }> = []; // Changed from [] to explicit type

  for (const order of activeOrders) {
    if (!order.assign_rider_id) {
      console.log(`Order ${order.id} has no assigned rider, skipping`);
      continue;
    }
    
    console.log(`Checking location for order ${order.id}, rider ${order.assign_rider_id}`);
    
    const value = await this.redisService.get(`rider:${order.assign_rider_id}:location`);
    
    if (!value) {
      console.log(`No location found for rider ${order.assign_rider_id}`);
      continue;
    }

    try {
      const loc = JSON.parse(value);
      console.log(`Location for rider ${order.assign_rider_id}:`, loc);
      
      ordersWithLocation.push({
        orderId: order.id,
        riderId: order.assign_rider_id,
        assign_rider: {
          locations: {
            lat: loc.lat,
            lng: loc.lng,
            heading: loc.heading,
          }
        },
        orderStatus: order.order_status,
      });
    } catch (err) {
      console.error(`Error parsing location for rider ${order.assign_rider_id}:`, err.message);
    }
  }

  console.log(`Sending ${ordersWithLocation.length} orders with locations`);
  client.emit('admin:all_orders', ordersWithLocation);
}

  @SubscribeMessage('admin:refresh_orders')
  async handleRefresh(@ConnectedSocket() client: Socket) {
    console.log('Admin requested refresh');
    await this.sendAllOrdersWithLocations(client);
  }
}