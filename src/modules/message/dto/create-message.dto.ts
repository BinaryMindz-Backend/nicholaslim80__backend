export class CreateMessageDto { }
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'The other user ID for one-to-one chat' })
  @IsString()
  @IsNotEmpty()
  otherUserId: string;
}


export class EventPayload {
  fromNotification: string;
  jobId: string;
  toNotification: string;
}