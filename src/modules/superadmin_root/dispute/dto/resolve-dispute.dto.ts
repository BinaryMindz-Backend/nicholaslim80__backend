import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class ResolveDisputeDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  disputeId: number;

  @ApiProperty({ enum: ['FULL', 'CUSTOM'] })
  @IsEnum(['FULL', 'CUSTOM'])
  refundType: 'FULL' | 'CUSTOM';

  @ApiProperty({ example: 120 })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ required: false, example: 70 })
  @IsOptional()
  @IsInt()
  userPercent?: number;

  @ApiProperty({ required: false, example: 30 })
  @IsOptional()
  @IsInt()
  riderPercent?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  adminId: number;
}
