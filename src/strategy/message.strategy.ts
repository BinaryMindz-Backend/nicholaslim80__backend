import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/core/database/prisma.service';
import { MessageService } from 'src/modules/message/message.service';
import { SendMessageSimpleDto } from 'src/modules/message/dto/simple-message.dto';



@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private logger = new Logger('MessagesGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly messagesService: MessageService,
    private readonly configService: ConfigService,
  ) { }

  // Map to track connected users
  private connectedUsers = new Map<string, string>();
  private allUsers = new Map<
    string,
    {
      socketId: string;
      userId: string;
    }
  >();
  // private cache = new NodeCache({
  //   stdTTL: 0,
  // });

  async handleConnection(client: Socket) {
    const cookieHeader = client.handshake.headers.cookie as string;

    if (!cookieHeader) {
      client.emit('error', { message: 'Authentication token is required' });
      client.disconnect();
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    try {
      const decoded: Awaited<Record<string, any>> = await this.jwtService.verifyAsync(
        cookieHeader,
        {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        },
      );
      if (!decoded || !decoded.sub) {
        client.emit('error', { message: 'Invalid token payload' });
        client.disconnect();
        return;
      }
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });
      if (!user) {
        client.emit('error', { message: 'User not found.' });
        client.disconnect();
        return;
      }

      this.connectedUsers.set(user.id, client.id);
      this.cache.set(client.id, user.id);

      this.cache.set(user.id, client.id);
      this.allUsers.set('online', {
        socketId: client.id,
        userId: user.id,
      });
      this.logger.log(`User ${user.id} connected with socket ID ${client.id}`);
      // client.join(`${this.userIdSocketId.get(user.id)}-${this.socketIdUserId.get(client.id)}`);
    } catch (error) {
      console.error('Authentication error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.cache.del(client.id);
    // Find and remove user from connected users map
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.logger.log(`User ${userId} disconnected`);
        client.broadcast.emit('user_offline', { userId });
        break;
      }
    }
  }

  @SubscribeMessage('send_message')
  async sendMessage(@MessageBody() dto: SendMessageSimpleDto, @ConnectedSocket() client: Socket) {
    this.logger.log(`Received message from ${client.id} to ${dto.receiverId}`);
    const receiveSocketId: string = this.cache.get(dto.receiverId) as string;

    // if (!receiveSocketId) return console.error('Receiver not connected');
    if (!dto?.receiverId) {
      this.logger.error('Receiver ID missing in message DTO:', dto);
      return;
    }

    const senderId = this.cache.get(client.id) as string;
    // await this.messagesService.sendMessage(senderId, { ...dto });
    this.server.to(receiveSocketId).emit('receive_message', {
      ...dto,
      senderId: this.cache.get(client.id),
      status: 'Sms sent via socket server successfully',
    });
  }





}