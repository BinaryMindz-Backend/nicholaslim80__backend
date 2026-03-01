import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncentiveStatus, IncentiveType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsDateString, IsString, IsIn, IsEnum } from 'class-validator';

export class IncentiveQueryDto {

  @ApiPropertyOptional({
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: '2026-02-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-02-27',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // ✅ SEARCH
  @ApiPropertyOptional({
    example: 'bonus',
    description: 'Search incentives',
  })
  @IsOptional()
  @IsString()
  search?: string;

  // ✅ SORT
  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc' = 'desc';

  // ✅ STATUS FILTER
  @ApiPropertyOptional({
    enum: IncentiveStatus,
    description: 'Filter by incentive status',
  })
  @IsOptional()
  @IsEnum(IncentiveStatus)
  status?: IncentiveStatus;

  // ✅ TYPE FILTER
  @ApiPropertyOptional({
    enum: IncentiveType,
    description: 'Filter by incentive type',
  })
  @IsOptional()
  @IsEnum(IncentiveType)
  type?: IncentiveType;
}

