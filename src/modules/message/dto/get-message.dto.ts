import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetMessagesSimpleDto {
  @ApiProperty({ description: 'The other user ID for one-to-one chat' })
  @IsString()
  otherUserId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 50;

  @ApiProperty({
    description: 'Message ID to fetch messages before (cursor-based pagination)',
    required: false,
  })
  @IsOptional()
  @IsString()
  beforeMessageId?: string; // For cursor-based pagination
}