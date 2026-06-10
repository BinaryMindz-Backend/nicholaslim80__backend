import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/core/database/prisma.service';
import { SendMessageSimpleDto } from 'src/modules/message/dto/simple-message.dto';
import Redis from 'ioredis';
import { MessagesService } from './message.service';
import { EmailQueueService } from '../queue/services/email-queue.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://admin.zipbee.sg'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'api/v1/messages',
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server!: Server;

  private logger = new Logger(MessagesGateway.name);
  private redis: Redis;
  private connectedUsers = new Map<string, string>();

  constructor(

    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
    private readonly configService: ConfigService,
    private readonly emailQueueService: EmailQueueService,
    
  ) {
    const redisUrl = this.configService.get('REDIS_URL') || 'redis://redis:6379';
    this.redis = new Redis(redisUrl);
  }

  afterInit(server: Server) {
    this.logger.log('Socket.IO server initialized', server.adapter?.name ?? '');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    const token = client.handshake.auth.token as string;
    this.logger.log(`token received: ${token}`);
    if (!token) {
      client.emit('error', { message: 'Authentication token is required' });
      client.disconnect();
      return;
    }

    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      this.logger.log(`Decoded token: ${JSON.stringify(decoded)}`);
      if (!decoded?.sub) {
        client.disconnect();
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });
      this.logger.log(`User found: ${JSON.stringify(user)}`);

      if (!user) {
        client.disconnect();
        return;
      }

      await this.redis.set(`socket:${client.id}`, user.id);
      await this.redis.set(`user:${user.id}`, client.id);

      this.connectedUsers.set(String(user.id), client.id);
      this.logger.log(`User ${user.id} connected with socket: ${client.id}`)
      client.emit('connected', { userId: user.id });
    } catch (error) {
      this.logger.error('Authentication error:', error);
      client.disconnect();
    }
  }

  // ---------------------------
  // DISCONNECT
  // ---------------------------
  async handleDisconnect(client: Socket) {
    try {
      const userId = await this.redis.get(`socket:${client.id}`);

      await this.redis.del(`socket:${client.id}`);

      if (userId) {
        await this.redis.del(`user:${userId}`);
        this.connectedUsers.delete(userId);

        client.broadcast.emit('user_offline', { userId });

        this.logger.log(`User ${userId} disconnected`);
      }
    } catch (err) {
      this.logger.error('Redis error on disconnect', err);
    }
  }

  // ---------------------------
  // SEND MESSAGE
  // ---------------------------

  @SubscribeMessage('send_message')
  async sendMessage(
    @MessageBody() dto: SendMessageSimpleDto,
    @ConnectedSocket() client: Socket,
  ) {
   console.log('1. event received');

      if (!dto.receiverId) {
        console.log('2. receiverId missing');
        return;
      }

      const senderId = await this.redis.get(`socket:${client.id}`);
      console.log('3. senderId', senderId);

      if (!senderId) {
        console.log('4. sender not found');
        return;
      }

      console.log('5. before save message');

      const message = await this.messagesService.sendMessage(
        String(senderId),
        dto,
      );

      console.log('6. message saved', dto);

      console.log('7. before receiver redis lookup');

      const receiverSocketId = await this.redis.get(
        `user:${dto.receiverId}`,
      );

      console.log('8. receiverSocketId', receiverSocketId);
    // USER ONLINE
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('receive_message', {
        ...message,
        status: 'delivered',
      });

      this.logger.log(
        `Message sent via socket ${senderId} -> ${dto.receiverId}`,
      );
    }

    // USER OFFLINE
     else {
      this.logger.warn(
        `Receiver ${dto.receiverId} offline, sending push notification`,
      );

      const receiver = await this.prisma.user.findUnique({
        where: {
          id: Number(dto.receiverId),
        },
        select: {
          id: true,
          fcmToken: true,
        },
      });

       await this.prisma.user.findUnique({
        where: {
          id: Number(senderId),
        },
        select: {
          id: true,
          email: true,
          profile:{
              select:{
                firstName:true,
              }
          }
        },
      });
      console.log('rciever-0-.',receiver);
      if (receiver?.fcmToken) {
           await this.emailQueueService.queuePushNotification({
                userId: receiver.id,
                fcmToken: receiver.fcmToken,
                type: 'NEW_MESSAGE',
                title: '💬 New message',
                body: 'You received a new message',

                data: {
                  orderId: String(dto.orderId),
                  conversationId: String(message.conversationId),
                  senderId: String(senderId),
                  type: 'chat',
                },
              });
            this.logger.log(
              `Push notification sent to ${receiver.id}`,
            );
        }
    }

      // optional ack to sender
      return {
        success: true,
        message,
      };
  }

  }
