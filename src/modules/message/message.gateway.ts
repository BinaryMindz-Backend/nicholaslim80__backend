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

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'api/v1/messages',
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private logger = new Logger(MessagesGateway.name);
  private redis: Redis;
  private connectedUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
    private readonly configService: ConfigService,
  ) { }

  afterInit(server: Server) {
    this.logger.log('Socket.IO server initialized', server.adapter?.name ?? '');
  }

  async handleConnection(client: Socket) {
    const cookie = client.handshake.headers.cookie as string;

    if (!cookie) {
      client.emit('error', { message: 'Authentication token is required' });
      client.disconnect();
      return;
    }

    try {
      const decoded = await this.jwtService.verifyAsync(cookie, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (!decoded?.sub) {
        client.disconnect();
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

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
    if (!dto.receiverId) {
      this.logger.error('Missing receiverId in DTO');
      return;
    }

    const senderId = await this.redis.get(`socket:${client.id}`);
    const receiverSocketId = await this.redis.get(`user:${dto.receiverId}`);

    if (!receiverSocketId) {
      this.logger.warn(`Receiver ${dto.receiverId} not online`);
      return;
    }

    this.server.to(receiverSocketId).emit('receive_message', {
      ...dto,
      senderId,
      status: 'Message delivered via socket',
    });

    this.logger.log(
      `Message sent from ${senderId} -> ${dto.receiverId}`,
    );
  }
}
