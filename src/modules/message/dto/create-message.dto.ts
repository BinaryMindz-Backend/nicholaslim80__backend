import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'The other user ID for one-to-one chat' })
  @IsString()
  @IsNotEmpty()
  otherUserId: string;

  @ApiPropertyOptional({ description: 'The order ID for one-to-one chat' })
  @IsString()
  @IsOptional()
  orderId?: string;
}


export class EventPayload {
  fromNotification: string;
  jobId: string;
  toNotification: string;
}