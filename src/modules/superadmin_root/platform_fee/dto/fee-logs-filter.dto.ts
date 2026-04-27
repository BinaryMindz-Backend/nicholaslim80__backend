import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FeeLogType } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class FeeLogFilterDto {
  @ApiPropertyOptional({ enum: FeeLogType })
  @IsOptional()
  @IsEnum(FeeLogType)
  logType?: FeeLogType;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2027-01-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}