import {
  Body,
  Controller,
  Post,
  Get,

  Req,
} from '@nestjs/common';


import type { Request } from 'express';
import { ApiResponses } from 'src/common/apiResponse';
import { MessagesService } from './message.service';
import { MessagesGateway } from './message.gateway';
import { CreateConversationDto } from './dto/create-message.dto';
import { GetMessagesSimpleDto } from './dto/get-message.dto';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly gateway: MessagesGateway,
  ) { }

  @Post('conversations')
  async createConversation(@Req() req: Request, @Body() dto: CreateConversationDto) {
    const conversation = await this.messagesService.getOrCreateConversation(
      req['userid'] as string,
      dto,
    );
    return ApiResponses.success(conversation, 'Conversation ready');
  }

  @Get('conversations')
  async getConversations(@Req() req: Request) {
    const conversations = await this.messagesService.getConversations(req['userid'] as string);
    return ApiResponses.success(conversations, 'Conversations retrieved');
  }

  @Post('messages')
  async getMessages(@Req() req: Request, @Body() query: GetMessagesSimpleDto) {
    const result = await this.messagesService.getMessages(req['userid'] as string, query);
    return ApiResponses.success(result, 'Messages retrieved');
  }



  // ============ Utility ============
}