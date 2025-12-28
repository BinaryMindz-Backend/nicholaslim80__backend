import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { DisputeStatus } from '@prisma/client';

export class DisputeQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  orderId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  createdById?: number;

  @ApiPropertyOptional({ enum: DisputeStatus })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;
}
