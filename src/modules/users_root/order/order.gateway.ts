import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'src/modules/auth/redis/redis.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/guards/ws-jwt.guard';
import { RaiderService } from 'src/modules/raider_root/raider gateways/raider.service';
import { RaiderWithLocation } from 'src/types';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/admin' })
@UseGuards(WsJwtGuard)
export class OrderGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

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
             catch (err : any) {
                console.error(`❌ Error parsing location for rider ${raider.id}:`, err.message);
            }
          }

          //  
          console.log(`\n📤 Final total raider location to send: ${allRaider.length}`);
          console.log(`📤 Raider loaction data:`, JSON.stringify(allRaider, null, 2));
          console.log(`📤 Emitting to client ${client.id}`);

          client.emit('admin:loc_raider', raidersWithLocation);
       
          console.log(`✅ Emitted admin:all_raider event`);
    } catch (error : any) {
       console.error(`❌ Error parsing location for rider error.message ${error.message}`);
    }
  }
  
  
  @SubscribeMessage('admin:refresh_orders')
  async handleRefresh(@ConnectedSocket() client: Socket) {
    console.log('Admin requested refresh');
    await this.sendAllRiderLocationToAdmin(client);
  }


}