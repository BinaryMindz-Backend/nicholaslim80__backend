import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class RaiderQuizFilterDto {

  @ApiPropertyOptional({ description: 'Minimum score filter', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Maximum score filter', example: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxScore?: number;

  @ApiPropertyOptional({ description: 'Minimum correct answers', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minCorrect?: number;

  @ApiPropertyOptional({ description: 'Minimum attempt count', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAttempts?: number;

  @ApiPropertyOptional({
    description: 'From date for filtering (YYYY-MM-DD)',
    example: '2025-12-01',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'To date for filtering (YYYY-MM-DD)',
    example: '2025-12-05',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ example: 1, description: 'Pagination page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Pagination limit' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    example: 'completed_at',
    description: 'Sort by column (score, attempt_count, completed_at)',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Sort order (asc | desc)',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'], {
    message: 'sortOrder must be "asc" or "desc"',
  })
  sortOrder?: 'asc' | 'desc';
}
