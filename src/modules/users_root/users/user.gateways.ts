/* eslint-disable @typescript-eslint/require-await */
import { JwtService } from "@nestjs/jwt";
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ namespace: '/user', cors: true })
export class UserGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) return client.disconnect();

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const userId = Number(payload.sub);

      client.data.user = { id: userId };
      client.join(`user_${userId}`);

      console.log(`✅ User ${userId} connected & joined room user_${userId}`);
    } catch {
      client.disconnect();
    }
  }

    async handleDisconnect(client: Socket) {
        try {
        const userId = client.data.user?.id;
        if (!userId) {
            console.log('User disconnecting:', userId);
            console.log('User set offline:', userId);
        }
        } catch (err) {
        console.log('Error during disconnect:', err.message);
        }
    }
    
   // notify user when rider assiin
   async notifyUserRiderAssigned(
    userId: number,
    orderId: number,
    riderId: number,
    ) {
    console.log(`📢 Notifying USER ${userId} that rider ${riderId} got order ${orderId}`);

    this.server.to(`user_${userId}`)
        .emit('user:rider_assigned', {
        orderId,
        riderId,
        message: '🚴 Your order has been assigned to a rider!',
        });
    }   
}
