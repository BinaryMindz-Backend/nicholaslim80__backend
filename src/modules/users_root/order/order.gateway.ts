import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
// import { OrderService } from './order.service';
import { RedisService } from 'src/modules/auth/redis/redis.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/guards/ws-jwt.guard';
import { RaiderService } from 'src/modules/raider_root/raider gateways/raider.service';
import { RaiderWithLocation } from 'src/types';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/admin' })
@UseGuards(WsJwtGuard)
export class OrderGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private redisService: RedisService,
    // private orderService: OrderService,
     private raiderService: RaiderService,
  ) { }

  async handleConnection(client: Socket) {
    console.log('Admin connected:', client.id);
    client.join('admin:live-map');

    // Send initial data
    await this.sendAllRiderLocationToAdmin(client);
  }
  //  **old
  // private async sendAllOrdersWithLocations(client: Socket) {
  //   try {
  //     console.log('🔵 sendAllOrdersWithLocations called for client:', client.id);

  //     const activeOrders = await this.orderService.getAllActiveOrders();
  //     console.log("📦 active orders count:", activeOrders.length);
  //     console.log("📦 active orders:", JSON.stringify(activeOrders, null, 2));

      // const ordersWithLocation: OrderWithLocation[] = [];

  //     for (const order of activeOrders) {
  //       console.log(`\n--- Processing order ${order.id} ---`);

  //       if (!order.assign_rider_id) {
  //         console.log(`⚠️ Order ${order.id} has no assigned rider, skipping`);
  //         continue;
  //       }

  //       console.log(`✓ Order ${order.id} has rider ${order.assign_rider_id}`);

  //       const locationKey = `rider:${order.assign_rider_id}:location`;
  //       console.log(`🔍 Looking for key: ${locationKey}`);

  //       const value = await this.redisService.get(locationKey);

  //       if (!value) {
  //         console.log(`❌ No location found in Redis for rider ${order.assign_rider_id}`);
  //         continue;
  //       }

  //       console.log(`✓ Found location value:`, value);

  //       try {
  //         const loc = JSON.parse(value);
  //         console.log(`✓ Parsed location:`, loc);

  //         const orderData = {
  //           orderId: order.id,
  //           riderId: order.assign_rider_id,
  //           vehicleType: order.vehicle,
  //           assign_rider: {
  //             locations: {
  //               lat: loc.lat,
  //               lng: loc.lng,
  //               heading: loc.heading,
  //             }
  //           },
  //           orderStatus: order.order_status,
  //         };

  //         console.log(`✓ Pushing order data:`, orderData);
  //         ordersWithLocation.push(orderData);

  //       } catch (err) {
  //         console.error(`❌ Error parsing location for rider ${order.assign_rider_id}:`, err.message);
  //       }
  //     }

  //     console.log(`\n📤 Final orders to send: ${ordersWithLocation.length}`);
  //     console.log(`📤 Orders data:`, JSON.stringify(ordersWithLocation, null, 2));
  //     console.log(`📤 Emitting to client ${client.id}`);

  //     client.emit('admin:all_orders', ordersWithLocation);

  //     console.log(`✅ Emitted admin:all_orders event`);

  //   } catch (error) {
  //     console.error('❌ Error in sendAllOrdersWithLocations:', error);
  //     console.error(error.stack);
  //   }
  // }
  // send all online raider location to admin
  
  private async sendAllRiderLocationToAdmin(client:Socket){
    try {
      console.log('🔵 sendAllOrdersWithLocations called for client:', client.id);
        // 
       const allRaider = await this.raiderService.findAllRaider();
          //  
          const raidersWithLocation: RaiderWithLocation[] = [];
          // 
          for(const raider of allRaider){
                //  
             console.log(`\n--- Processing raider ${raider.id} ---`);
             //  
              const locationKey = `rider:${raider.id}:location`;
              console.log(`🔍 Looking for key: ${locationKey}`);

              const value = await this.redisService.get(locationKey);

              if (!value) {
                console.log(`❌ No location found in Redis for rider ${raider.id}`);
                continue;
              }

              console.log(`✓ Found location value:`, value);
              try {
                const loc = JSON.parse(value);
                console.log(`✓ Parsed location:`, loc);
                const raiderData = {
                  riderId: raider.id,
                    locations: {
                      lat: loc.lat,
                      lng: loc.lng,
                      heading: loc.heading,
                    }
                  }

                console.log(`✓ Pushing Raider data:`, raiderData);
                raidersWithLocation.push(raiderData);
                }
             catch (err) {
                console.error(`❌ Error parsing location for rider ${raider.id}:`, err.message);
            }
          }

          //  
          console.log(`\n📤 Final total raider location to send: ${allRaider.length}`);
          console.log(`📤 Raider loaction data:`, JSON.stringify(allRaider, null, 2));
          console.log(`📤 Emitting to client ${client.id}`);

          client.emit('admin:loc_raider', raidersWithLocation);
       
          console.log(`✅ Emitted admin:all_raider event`);
    } catch (error) {
       console.error(`❌ Error parsing location for rider error.message ${error.message}`);
    }
  }
  
  
  @SubscribeMessage('admin:refresh_orders')
  async handleRefresh(@ConnectedSocket() client: Socket) {
    console.log('Admin requested refresh');
    await this.sendAllRiderLocationToAdmin(client);
  }
  // old**
  // async broadcastOrderAssigned(orderId: number, riderId: number, riderName: string) {
  //   console.log(`📣 Broadcasting: Order ${orderId} assigned to ${riderName} (${riderId})`);
    
  //   await this.server.to('admin:live-map').emit('admin:order_assigned', {
  //     orderId,
  //     riderId,
  //     riderName,
  //     assignedAt: new Date(),
  //   });
  // }

}