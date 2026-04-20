import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsNumber } from 'class-validator';

export class ResolveDisputeDto {
  @ApiProperty({
    example: 1,
    description: 'Dispute ID',
  })
  @IsInt()
  disputeId: number;

  @ApiProperty({
    example: 500,
    description: 'Total refund amount',
  })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({
    example: 'FULL',
    description: 'Refund type',
    enum: ['FULL', 'CUSTOM'],
  })
  refundType: 'FULL' | 'CUSTOM';

  @ApiProperty({
    example: 70,
    required: false,
    description: 'Rider percentage (if CUSTOM)',
  })
  @IsOptional()
  @IsNumber()
  riderPercent?: number;

  @ApiProperty({
    example: 30,
    required: false,
    description: 'Company percentage (if CUSTOM)',
  })
  @IsOptional()
  @IsNumber()
  companyPercent?: number;

  @ApiProperty({
    example: 1,
    description: 'Admin user ID resolving dispute',
  })
  @IsInt()
  adminId: number;
}
