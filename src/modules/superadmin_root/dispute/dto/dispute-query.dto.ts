import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DisputeStatus } from '@prisma/client';

export class DisputeQueryDto {
  // @ApiPropertyOptional({ example: 101 })
  // @IsOptional()
  // @Type(() => Number)
  // @IsInt()
  // orderId?: number;

  // @ApiPropertyOptional({ example: 5 })
  // @IsOptional()
  // @Type(() => Number)
  // @IsInt()
  // createdById?: number;

  @ApiPropertyOptional({ enum: DisputeStatus })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  // Pagination
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (starts from 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of records per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
