import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum DisputeStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  AWAITING_INFO = 'AWAITING_INFO',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export class DisputeQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @ApiPropertyOptional({ example: 101 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orderId?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  riderId?: number;

  @ApiPropertyOptional({
    example: DisputeStatus.PENDING,
    enum: DisputeStatus,
  })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;
}
