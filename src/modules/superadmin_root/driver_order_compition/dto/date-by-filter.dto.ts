import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class DateByFilterDto {
  @ApiPropertyOptional({ example: '2025-01-01', description: 'Filter logs from this date (YYYY-MM-DD)' })
  @IsString()
  date: string;
}