import { Type } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";

export class DriverPerformanceFilterDto {
  @IsOptional()
  @IsEnum(['this_month', 'last_month', 'custom'])
  period?: 'this_month' | 'last_month' | 'custom';

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
