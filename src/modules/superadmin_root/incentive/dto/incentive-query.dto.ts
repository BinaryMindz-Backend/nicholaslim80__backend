import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsDateString } from 'class-validator';

export class IncentiveQueryDto {

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;


  @ApiPropertyOptional({
    example: 10,
    description: 'Number of records per page',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;


  @ApiPropertyOptional({
    example: '2026-02-01',
    description: 'Filter incentives from this date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;


  @ApiPropertyOptional({
    example: '2026-02-27',
    description: 'Filter incentives until this date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
