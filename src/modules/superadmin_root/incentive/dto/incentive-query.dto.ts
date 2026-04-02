import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncentiveStatus, IncentiveRewardType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsDateString, IsString, IsEnum } from 'class-validator';

export class IncentiveQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: '2026-02-01', description: 'Filter incentives starting from this date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-02-27', description: 'Filter incentives ending before this date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'bonus', description: 'Search incentives by name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'Sort by creation date' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ enum: IncentiveStatus, description: 'Filter by incentive status' })
  @IsOptional()
  @IsEnum(IncentiveStatus)
  status?: IncentiveStatus;

  @ApiPropertyOptional({ enum: IncentiveRewardType, description: 'Filter by Incentive Reward Type' })
  @IsOptional()
  @IsEnum(IncentiveRewardType)
  reward_type?: IncentiveRewardType;

  @ApiPropertyOptional({ example: 'Car', description: 'Filter by driver type name' })
  @IsOptional()
  driver_type_name?: string;

  @ApiPropertyOptional({ example: 1, description: 'Filter by service zone ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  serviceZoneId?: number;

  @ApiPropertyOptional({ example: 'Dhaka Zone', description: 'Filter by service zone name' })
  @IsOptional()
  @IsString()
  serviceZoneName?: string;
}