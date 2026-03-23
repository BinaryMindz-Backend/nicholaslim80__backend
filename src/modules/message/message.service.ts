
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateConversationDto } from './dto/create-message.dto';
import { SendMessageSimpleDto } from './dto/simple-message.dto';
import { GetMessagesSimpleDto } from './dto/get-message.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);
  constructor(private readonly prisma: PrismaService,

  ) { }

  // async getOrCreateConversation(userId: string | number, dto: CreateConversationDto): Promise<any> {
  //   this.logger.log(`Getting or creating conversation between ${userId} and ${dto.otherUserId}`);
  //   try {
  //     const otherUser = await this.prisma.user.findUnique({
  //       where: { id: Number(dto.otherUserId) },
  //     });

  //     if (!otherUser) {
  //       this.logger.error(`User not found: ${dto.otherUserId}`);
  //       throw new NotFoundException('User not found');
  //     }

  //     if (Number(userId) === Number(dto.otherUserId)) {
  //       this.logger.error(`User ${userId} attempted to create a conversation with themselves`);
  //       throw new BadRequestException('Cannot create conversation with yourself');
  //     }

  //     // Ensure consistent ordering for unique constraint
  //     const [user1Id, user2Id] = [Number(userId), Number(dto.otherUserId)].sort();

  //     // Check if conversation already exists
  //     let conversation = await this.prisma.conversation.findUnique({
  //       where: {
  //         user1Id_user2Id: { user1Id: Number(user1Id), user2Id: Number(user2Id) },
  //         orderId: String(dto.orderId),
  //       },
  //       include: {
  //         user1: {
  //           select: { id: true, email: true, },
  //         },
  //         user2: {
  //           select: { id: true, email: true, },
  //         },
  //       },
  //     });

  //     if (!conversation) {
  //       this.logger.log(`Creating conversation between ${userId} and ${dto.otherUserId}`);
  //       if (dto.orderId) {
  //         conversation = await this.prisma.conversation.update({
  //           where: { user1Id_user2Id: { user1Id: Number(user1Id), user2Id: Number(user2Id) } },
  //           data: { orderId: String(dto.orderId) },
  //         });
  //       }
  //       conversation = await this.prisma.conversation.create({
  //         data: { user1Id: Number(user1Id), user2Id: Number(user2Id), orderId: String(dto.orderId) },
  //         include: {
  //           user1: {
  //             select: { id: true, email: true, },
  //           },
  //           user2: {
  //             select: { id: true, email: true, },
  //           },
  //         },
  //       });
  //     }
  //     this.logger.log(`Conversation retrieved/created between ${userId} and ${dto.otherUserId}`);
  //     return conversation;
  //   } catch (error) {
  //     this.logger.error(`Failed to get or create conversation between ${userId} and ${dto.otherUserId}`, error instanceof Error ? error.stack : '');
  //     const message = error instanceof Error ? error.message : 'An unknown error occurred';
  //     throw new InternalServerErrorException('Failed to get or create conversation', message);
  //   }
  // }
  async getOrCreateConversation(userId: string | number, dto: CreateConversationDto) {
    this.logger.log(`Getting or creating conversation between ${userId} and ${dto.otherUserId}`);

    const uid = Number(userId);
    const otherUid = Number(dto.otherUserId);

    if (uid === otherUid) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    const otherUser = await this.prisma.user.findUnique({ where: { id: otherUid } });
    if (!otherUser) throw new NotFoundException('User not found');

    // Sort for consistent ordering
    const [user1Id, user2Id] = [uid, otherUid].sort();

    // Try to find conversation (optionally include orderId if part of unique constraint)
    let conversation;
    try {
      conversation = await this.prisma.$transaction(async (tx) => {
        // Build dynamic where
        const whereCondition = dto.orderId
          ? { user1Id, user2Id, orderId: String(dto.orderId) }
          : { user1Id, user2Id };

        let conv = await tx.conversation.findFirst({
          where: whereCondition,
        });
        if (!conv) {
          conv = await tx.conversation.create({
            data: { user1Id, user2Id, orderId: dto.orderId ? String(dto.orderId) : undefined },
          });
        }
        return conv;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Another request created it first, retry find
        conversation = await this.prisma.conversation.findFirst({
          where: { user1Id, user2Id },
        });
      } else throw error;
    }

    this.logger.log(`Conversation retrieved/created between ${user1Id} and ${user2Id}`);
    return conversation;
  }





  async getConversations(userId: number, orderId?: string) {
    this.logger.log(`Retrieving conversations for user ${userId}`);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: Number(userId) }, { user2Id: Number(userId) }],
        orderId: String(orderId),
      },
      include: {
        user1: {
          select: { id: true, email: true, },
        },
        user2: {
          select: { id: true, email: true, },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            messageType: true,
            fileUrl: true,
            isRead: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: Number(userId),
                isRead: false,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    this.logger.log(`Found ${conversations.length} conversations for user ${userId}`);
    return conversations.map((conv) => ({
      id: conv.id,
      otherUser: conv.user1Id === Number(userId) ? conv.user2 : conv.user1,
      lastMessage: conv.messages[0] || null,
      unreadCount: conv._count.messages,
      updatedAt: conv.updatedAt,
      createdAt: conv.createdAt,
    }));
  }

  // ============ Message Management ============

  async sendMessage(userId: string, dto: SendMessageSimpleDto) {
    this.logger.log(`Sending message from ${userId} to ${dto.receiverId}`);
    try {
      const receiver = await this.prisma.user.findUnique({
        where: { id: Number(dto.receiverId) },
      });

      if (!receiver) {
        this.logger.error(`Receiver not found: ${dto.receiverId}`);
        throw new NotFoundException('Receiver not found');
      }
      // console.log("dto-->", dto);
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(userId, {
        otherUserId: dto.receiverId,
        orderId: String(dto.orderId),
      });

      // Create message
      const message = await this.prisma.$transaction(async (tx) => {

        const newMessage = await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: Number(userId),
            receiverId: Number(dto.receiverId),
            content: dto.content,
            messageType: dto.messageType,
            fileUrl: dto.fileUrl,
            fileName: dto.fileName,
            fileSize: dto.fileSize,
          },
          include: {
            sender: {
              select: { id: true, email: true },
            },
            receiver: {
              select: { id: true, email: true },
            },
          },
        });
        this.logger.log(`Message sent from ${userId} to ${dto.receiverId}`);
        // Update conversation timestamp
        await tx.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });

        return newMessage;
      });

      return message;
    } catch (error) {
      this.logger.error(`Failed to send message from ${userId} to ${dto.receiverId}`, error instanceof Error ? error.stack : '');
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new InternalServerErrorException('Failed to send message', message);
    }
  }

  async getMessages(userId: number, dto: GetMessagesSimpleDto) {
    this.logger.log(`Retrieving messages for user ${userId} in conversation with ${dto.otherUserId}`);
    try {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(Number(userId), {
        otherUserId: dto.otherUserId || "",
        orderId: String(dto.orderId),
      });
      const skip = ((dto.page || 1) - 1) * (dto.limit || 50);
      const take = dto.limit || 50;

      const where: {
        conversationId: string;
        isDeleted: boolean;
        createdAt?: { lt: Date };
      } = {
        conversationId: conversation.id,
        isDeleted: false,
      };

      // Cursor-based pagination
      if (dto.beforeMessageId) {
        this.logger.log(`Applying cursor-based pagination for user ${userId} in conversation with ${dto.otherUserId}`);
        const beforeMessage = await this.prisma.message.findUnique({
          where: { id: dto.beforeMessageId },
        });
        if (beforeMessage) {
          where.createdAt = { lt: beforeMessage.createdAt };
        }
      }

      const [messages, total] = await Promise.all([
        this.prisma.message.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { id: true, email: true },
            },
            receiver: {
              select: { id: true, email: true },
            },
          },
        }),
        this.prisma.message.count({ where }),
      ]);
      return {
        messages: messages.reverse(), // Reverse to get chronological order
        total,
        page: dto.page || 1,
        limit: dto.limit || 50,
        hasMore: skip + messages.length < total,
        conversationId: conversation.id,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve messages for user ${userId} in conversation with ${dto.otherUserId}`, error instanceof Error ? error.stack : '');
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new InternalServerErrorException('Failed to retrieve messages', message);
    }
  }
  //  update conversation by admin
   async markAsRead(userId: number, convrId: string,) {
      const ex = await this.prisma.conversation.findFirst({
        where: {
          id: convrId,
        },
      });

      if (!ex) {
        throw new NotFoundException('Conversation not found');
      }

      // Mark all messages as read where current user is receiver
      await this.prisma.message.updateMany({
        where: {
          conversationId: convrId,
          receiverId: userId,   // important
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return { message: 'Messages marked as read' };
    }





  //  get messages by order id
  // async getMessagesByOrderId(orderId: string, dto: GetMessagesSimpleDto) {
  //   this.logger.log(`Retrieving messages for order ${orderId}`);
  //   try {
  //     const skip = ((dto.page || 1) - 1) * (dto.limit || 50);
  //     const take = dto.limit || 50;
  //     const messages = await this.prisma.message.findMany({
  //       where: { conversation: { orderId } },
  //       orderBy: { createdAt: 'asc' },
  //       skip,
  //       take,
  //       include: {
  //         sender: {
  //           select: { id: true, email: true },
  //         },
  //         receiver: {
  //           select: { id: true, email: true },
  //         },
  //       },
  //     });
  //     return messages;
  //   } catch (error) {
  //     this.logger.error(`Failed to retrieve messages for order ${orderId}`, error instanceof Error ? error.stack : '');
  //     const message = error instanceof Error ? error.message : 'An unknown error occurred';
  //     throw new InternalServerErrorException('Failed to retrieve messages', message);
  //   }
  // }





}


export interface IUser {
  id: number;
  email: string;
  phone: string;
  role: Role;
}