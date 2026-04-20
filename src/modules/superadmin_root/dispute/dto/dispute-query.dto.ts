import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class DisputeQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  limit?: number;

  @ApiPropertyOptional({ example: 101 })
  @IsOptional()
  @IsInt()
  orderId?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @IsInt()
  riderId?: number;

  @ApiPropertyOptional({
    example: 'PENDING',
    enum: ['PENDING', 'UNDER_REVIEW', 'AWAITING_INFO', 'RESOLVED', 'REJECTED'],
  })
  @IsOptional()
  status?: string;
}
