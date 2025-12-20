import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  IsEnum,
  IsObject,
} from 'class-validator';
import { CoinEvent } from 'src/types';

export class CreateCoinDto {
  @ApiProperty({
    enum: CoinEvent,
    example: CoinEvent.DAILY_LOGIN,
    description: 'Unique reward key (e.g., DAILY_LOGIN, REFERRAL)',
  })
  @IsEnum(CoinEvent)
  @IsNotEmpty()
  key: CoinEvent;

  @ApiPropertyOptional({
    example: 'Reward for daily login',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 10,
    description: 'Number of coins rewarded',
  })
  @IsInt()
  @Min(1)
  coin_amount: number;

  @ApiPropertyOptional({
    example: { maxPerDay: 1 },
    description: 'Dynamic reward condition stored as JSON',
  })
  @IsOptional()
  @IsObject()
  condition?: Record<string, any>;

  @ApiPropertyOptional({
    example: 30,
    description: 'Coin expiration in days',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expire_days?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Coin monetary value in cents',
  })
  @IsOptional()
  @IsInt()
  coin_value_in_cent?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Is reward active',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
