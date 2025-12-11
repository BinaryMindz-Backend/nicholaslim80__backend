import { ApiProperty } from '@nestjs/swagger';
import { CoinEvent } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
} from 'class-validator'; 

export class CreateCoinManagementDto {
  @ApiProperty({
    example: 'SIGNUP_BONUS',
    enum: CoinEvent,
    description: 'Event that triggered coin reward',
  })
  @IsEnum(CoinEvent)
  event_triggered: CoinEvent;

  @ApiProperty({
    example: '50.00',
    description: 'Amount of coin earned (Decimal). Use string format.',
  })
  @IsNotEmpty()
  @IsString()
  coin_amount: string;  

  @ApiProperty({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Expiration date of the coins (optional)',
 
  })
  @IsNotEmpty()
  @IsString()
  expire_date: Date;

  @ApiProperty({
    example: 5000,
    description: 'Coin value in cents (integer, optional)',
  })
  @IsNotEmpty() 
  coin_value_in_cent?: number;
}
