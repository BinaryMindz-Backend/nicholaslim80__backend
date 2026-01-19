import { ApiPropertyOptional } from "@nestjs/swagger";
import { FeeLogType } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional } from "class-validator";

export class FeeLogFilterDto {
  @ApiPropertyOptional({
    enum: FeeLogType,
    description: 'Filter by fee configuration type',
  })
  @IsOptional()
  @IsEnum(FeeLogType)
  logType?: FeeLogType;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Start date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2027-01-31',
    description: 'End date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
