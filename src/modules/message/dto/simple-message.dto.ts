import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  PDF = 'PDF',
}

export class SendMessageSimpleDto {
  @ApiProperty({ description: 'The receiver user ID' })
  @IsString()
  receiverId: string;

  @ApiPropertyOptional({ required: false, description: 'The order ID' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ description: 'The message content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'The message type' })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiPropertyOptional({ description: 'The file URL' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'The file name' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'The file size' })
  @IsOptional()
  fileSize?: number;
}