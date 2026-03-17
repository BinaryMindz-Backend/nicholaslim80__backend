import { IncentiveStatus, ClaimType, DriverType, IncentiveRewardType, Metric, Operator } from '@prisma/client';
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class IncentiveRuleDto {
  @ApiProperty({ example: 'COMPLETED_DELIVERIES' })
  @IsEnum(Metric)
  metric: Metric; // use enum type

  @ApiProperty({ example: 'GTE' })
  @IsEnum(Operator)
  operator: Operator;

  @ApiProperty({ example: 10 })
  @IsNumber()
  value: number;
}

export class CreateIncentiveDto {
  @ApiProperty({ description: 'Name of the incentive', required: true, example: 'Summer Bonus' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the incentive', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start date of the incentive', type: String, format: 'date-time' })
  @IsDateString()
  start_date: Date;

  @ApiProperty({ description: 'End date of the incentive', type: String, format: 'date-time' })
  @IsDateString()
  end_date: Date;

  @ApiProperty({ description: 'Driver type', enum: DriverType })
  @IsEnum(DriverType)
  driver_type: DriverType;

  @ApiProperty({ description: 'Priority (1-10)', example: 1 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ description: 'Status of the incentive', enum: IncentiveStatus })
  @IsEnum(IncentiveStatus)
  status: IncentiveStatus;

  @ApiProperty({ description: 'incentive Reward type', enum: IncentiveRewardType })
  @IsEnum(IncentiveRewardType)
  reward_type: IncentiveRewardType;

  @ApiProperty({ description: 'Reward value', example: 50 })
  @IsNumber()
  reward_value: number;

  @ApiProperty({ description: 'Claim type', enum: ClaimType })
  @IsEnum(ClaimType)
  claim_type: ClaimType;

  @ApiProperty({ description: 'Optional service zone ID', required: false })
  @IsOptional()
  @IsNumber()
  serviceZoneId?: number;

  @ApiProperty({
    description: 'Rules as array of objects',
    type: [IncentiveRuleDto],
    example: [{ metric: "COMPLETED_DELIVERIES", operator: "GTE", value: 10 }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncentiveRuleDto)
  rules: IncentiveRuleDto[];
}