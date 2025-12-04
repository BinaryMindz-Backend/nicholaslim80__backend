import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryTypeName, OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Min,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';



export class OrderFilterDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Start date filter (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-01-10',
    description: 'End date filter (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'COMPLETED',
    enum: OrderStatus,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    example: 'EXPRESS',
    description: 'Filter by category',
  })
  @IsOptional()
  @IsEnum(DeliveryTypeName)
  category?: string;


  @ApiPropertyOptional({
    example: 'ORD12345',
    description: 'Search by order ID',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
