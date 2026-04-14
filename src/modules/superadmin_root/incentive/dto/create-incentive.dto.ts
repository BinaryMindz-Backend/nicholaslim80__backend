import {
  IncentiveStatus,
  ClaimType,
  IncentiveRewardType,
  Metric,
  Operator,
  TimeUnit,
  MonthName,
  RecurringType,
  DayOfWeek,
} from '@prisma/client';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
  ValidateIf,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';


// ─── Max days per month (for validation) ───────────────────────────────────────
const MONTH_MAX_DAYS: Record<MonthName, number> = {
  Jan: 31, Feb: 28, Mar: 31, Apr: 30,
  May: 31, Jun: 30, Jul: 31, Aug: 31,
  Sep: 30, Oct: 31, Nov: 30, Dec: 31,
};

class IncentiveRuleDto {
  @ApiProperty({ example: 'COMPLETED_DELIVERIES' })
  @IsEnum(Metric)
  metric: Metric;

  @ApiProperty({ example: 'GTE' })
  @IsEnum(Operator)
  operator: Operator;

  @ApiProperty({ example: 10 })
  @IsNumber()
  value: number;
}

export class CreateIncentiveDto {
  @ApiProperty({ example: 'Summer Bonus' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  // ─── Schedule ─────────────────────────────────────────────────────────────
  @ApiProperty({ enum: RecurringType, example: RecurringType.ONE_TIME })
  @IsEnum(RecurringType)
  recurring_type: RecurringType;

  @ApiProperty({ description: 'Start date (required always)' })
  @IsDateString()
  start_date: string;

  /**
   * End date:
   * - ONE_TIME → NOT present (only start_date)
   * - DAILY / WEEKLY / MONTHLY → required
   */
  @ApiPropertyOptional({ description: 'End date — required for DAILY/WEEKLY/MONTHLY' })
  @ValidateIf((o) => o.recurring_type !== RecurringType.ONE_TIME)
  @IsDateString()
  end_date?: string;

  /**
   * Days of week — required for WEEKLY.
   * Also used for MONTHLY (week_of_month path) to specify which day(s) within the week.
   */
  @ApiPropertyOptional({
    enum: DayOfWeek,
    isArray: true,
    example: ['MON', 'WED', 'FRI'],
    description: 'Required for WEEKLY. Also used with week_of_month for MONTHLY.',
  })
  @ValidateIf((o) => o.recurring_type === RecurringType.WEEKLY)
  @ArrayNotEmpty({ message: 'days_of_week must not be empty for WEEKLY schedule' })
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  days_of_week?: DayOfWeek[];

  /**
   * Month — required for MONTHLY
   */
  @ApiPropertyOptional({ enum: MonthName, example: 'Jan', description: 'Required for MONTHLY' })
  @ValidateIf((o) => o.recurring_type === RecurringType.MONTHLY)
  @IsEnum(MonthName, { message: 'month must be a valid month name (Jan–Dec)' })
  month?: MonthName;

  /**
   * day_of_month — for MONTHLY day-based path (provide OR week_of_month+days_of_week)
   * Example: [1, 5, 10]
   */
  @ApiPropertyOptional({
    type: [Number],
    example: [1, 5, 10],
    description: 'Day(s) of month (1–31). Used with MONTHLY. Validated against month max days.',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  day_of_month?: number[];

  /**
   * week_of_month — for MONTHLY week-based path
   * Example: [1, 2, 3, 4, 5]
   */
  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2],
    description: 'Week(s) of month (1–5). Used with MONTHLY + days_of_week.',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(5, { each: true })
  week_of_month?: number[];

  // ─── Existing fields ───────────────────────────────────────────────────────
  @ApiPropertyOptional({ type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  driver_type_ids?: number[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ enum: IncentiveStatus })
  @IsEnum(IncentiveStatus)
  status: IncentiveStatus;

  @ApiProperty({ enum: IncentiveRewardType })
  @IsEnum(IncentiveRewardType)
  reward_type: IncentiveRewardType;

  @ApiProperty({ example: 50 })
  @IsNumber()
  reward_value: number;

  @ApiProperty({ enum: ClaimType })
  @IsEnum(ClaimType)
  claim_type: ClaimType;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  claim_expire?: number;

  @ApiPropertyOptional({ enum: TimeUnit, example: 'HOURS' })
  @IsOptional()
  @IsEnum(TimeUnit)
  time_constant?: TimeUnit;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  max_claim?: number;

  @ApiPropertyOptional({ type: [Number], example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  serviceZoneIds?: number[];

  @ApiProperty({
    type: [IncentiveRuleDto],
    example: [{ metric: 'COMPLETED_DELIVERIES', operator: 'GTE', value: 10 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncentiveRuleDto)
  rules: IncentiveRuleDto[];
}

// ─── Shared validation helper (used in service) ──────────────────────────────
export { MONTH_MAX_DAYS };