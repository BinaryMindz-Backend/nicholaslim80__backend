import { IncentiveStatus, IncentiveType } from '@prisma/client';
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncentiveDto {
  @ApiProperty({
    description: 'ID of the admin creating the incentive',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  adminId?: number;

  @ApiProperty({
    description: 'Name of the incentive',
    required: false,
    example: 'Summer Bonus',
  })
  @IsOptional()
  @IsString()
  incentive_name?: string;

  @ApiProperty({
    description: 'Type of the incentive',
    enum: IncentiveType,
    example: IncentiveType.REFERRAL,
  })
  @IsEnum(IncentiveType)
  type: IncentiveType;

  @ApiProperty({
    description: 'Start date of the incentive (ISO-8601 DateTime)',
    required: false,
    example: '2025-11-23T00:00:00Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @ApiProperty({
    description: 'End date of the incentive (ISO-8601 DateTime)',
    required: false,
    example: '2025-12-31T23:59:59Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  end_date?: Date;

  @ApiProperty({
    description: 'Amount of the incentive',
    required: false,
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  incentive_amount?: number;

  @ApiProperty({
    description: 'Status of the incentive',
    enum: IncentiveStatus,
    example: IncentiveStatus.ONGOING,
  })
  @IsEnum(IncentiveStatus)
  status: IncentiveStatus;
}
