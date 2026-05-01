import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GiftCoinsDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  coins: number;

  @ApiProperty({ example: 30, description: 'Expiration in days' })
  @IsInt()
  @Min(1)
  expiresInDays: number;

  @ApiProperty({
    example: 'Customer Service Compensation',
    description: 'Internal admin reason',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    example: "Hello robin, you've been gifted 50 coins!",
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}