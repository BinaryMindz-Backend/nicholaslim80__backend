import { IncentiveStatus, ClaimType, IncentiveRewardType, Metric, Operator, TimeUnit } from '@prisma/client';
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class IncentiveRuleDto {
  @ApiProperty({ example: 'COMPLETED_DELIVERIES' })
  @IsEnum(Metric)
  metric: Metric;

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

  
  @ApiProperty({ description: 'Driver type ID', example: 1 })
  @IsNumber()
  driver_type_id: number;

  @ApiProperty({ description: 'Driver type name', example: 'Car' })
  @IsString()
  driver_type_name: string;


  @ApiProperty({ description: 'Priority (1-10)', example: 1 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ description: 'Status of the incentive', enum: IncentiveStatus })
  @IsEnum(IncentiveStatus)
  status: IncentiveStatus;

  @ApiProperty({ description: 'Incentive reward type', enum: IncentiveRewardType })
  @IsEnum(IncentiveRewardType)
  reward_type: IncentiveRewardType;

  @ApiProperty({ description: 'Reward value', example: 50 })
  @IsNumber()
  reward_value: number;

  @ApiProperty({ description: 'Claim type', enum: ClaimType })
  @IsEnum(ClaimType)
  claim_type: ClaimType;

  @ApiPropertyOptional({ description: 'Claim expiration value', example: 2 })
  @IsOptional()
  @IsNumber()
  claim_expire?: number;

  @ApiPropertyOptional({ description: 'Time unit for claim expiration', enum: TimeUnit, example: 'HOURS' })
  @IsOptional()
  @IsEnum(TimeUnit)
  time_constant?: TimeUnit;

  @ApiPropertyOptional({ description: 'Maximum number of claims per user', example: 5 })
  @IsOptional()
  @IsNumber()
  max_claim?: number;

  @ApiPropertyOptional({ description: 'Service zone IDs (multiple)', type: [Number], example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  serviceZoneIds?: number[];

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