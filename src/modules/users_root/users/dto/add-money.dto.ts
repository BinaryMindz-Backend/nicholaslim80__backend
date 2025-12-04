import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class AddMoneyDto {
  @ApiProperty({
    example: 100,
    description: 'Amount of money to add to the wallet',
  })
  @IsNumber()
  @IsPositive()
  @Type(()=>Number)
  amount: number;
}
