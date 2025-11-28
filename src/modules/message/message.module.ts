import { Module } from '@nestjs/common';
import { ChatController, } from './message.controller';
import { MessagesGateway } from './message.gateway';
import { MessagesService } from './message.service';

@Module({
  controllers: [ChatController],
  providers: [MessagesService, MessagesGateway],
})
export class MessageModule { }
