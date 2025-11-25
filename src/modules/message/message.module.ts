import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessagesGateway } from './message.gateway';

@Module({
  controllers: [MessageController],
  providers: [MessageService, MessagesGateway],
})
export class MessageModule { }
