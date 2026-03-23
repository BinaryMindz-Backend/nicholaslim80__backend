import {
  Body,
  Controller,
  Post,
  Get,

  Req,
  Patch,
  Param,
} from '@nestjs/common';


import type { Request } from 'express';
import { ApiResponses } from 'src/common/apiResponse';
import { MessagesService } from './message.service';
import { MessagesGateway } from './message.gateway';
import { CreateConversationDto } from './dto/create-message.dto';
import { GetMessagesSimpleDto } from './dto/get-message.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';

import { Role } from '@prisma/client';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';

export interface IUser {
  id: number;
  email: string;
  phone: string;
  role: Role;
}
@Controller('chat')
@Auth()
@ApiBearerAuth()
@RequirePermission(Module.SERVICE_CHAT, Permission.ALL)
export class ChatController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly gateway: MessagesGateway,
  ) { }

  @Post('conversations')
  @Auth()
  @ApiBearerAuth()
  async createConversation(@Req() req: Request, @Body() dto: CreateConversationDto) {
    const conversation = await this.messagesService.getOrCreateConversation(
      (req.user as IUser).id,
      dto,
    );
    return ApiResponses.success(conversation, 'Conversation ready');
  }

  @Get('conversations')
  @Auth()
  @ApiBearerAuth()
  async getConversations(@CurrentUser() user: IUser) {
    const conversations = await this.messagesService.getConversations(user.id);
    return ApiResponses.success(conversations, 'Conversations retrieved');
  }

  @Post('messages')
  @Auth()
  @ApiBearerAuth()
  async getMessages(@Body() query: GetMessagesSimpleDto, @CurrentUser() user: IUser) {
    const result = await this.messagesService.getMessages(user.id, query);
    return ApiResponses.success(result, 'Messages retrieved');
  }
  //
  @Patch('read/:conversationId')
  @Auth()
  @ApiBearerAuth()
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: IUser,
  ) {
    const result = await this.messagesService.markAsRead(
      user.id,
      conversationId,
    );

    return ApiResponses.success(result, 'Messages marked as read');
  }
    // 
  // @Post('messages/send')
  // @Auth()
  // @ApiBearerAuth()
  // async sendMessage(@Body() query: GetMessagesSimpleDto) {
  //   const result = await this.messagesService.getMessagesByOrderId(query.orderId!, query);
  //   return ApiResponses.success(result, 'Messages retrieved');
  // }


  // ============ Utility ============
}