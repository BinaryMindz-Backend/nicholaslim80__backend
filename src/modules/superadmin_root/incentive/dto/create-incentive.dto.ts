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

// ─── Max days per month (for validation) ──────────────────────────────────────
export const MONTH_MAX_DAYS: Record<MonthName, number> = {
  Jan: 31, Feb: 28, Mar: 31, Apr: 30,
  May: 31, Jun: 30, Jul: 31, Aug: 31,
  Sep: 30, Oct: 31, Nov: 30, Dec: 31,
};

// ─── Single rule ───────────────────────────────────────────────────────────────
// Used inside a rule group.
// AND logic:  all rules within one group must pass.
// OR  logic:  groups are OR-ed — passing any one group qualifies the user.
export class IncentiveRuleDto {
  @ApiProperty({
    enum: Metric,
    example: Metric.COMPLETED_DELIVERIES,
    description: 'The metric to evaluate for this rule.',
  })
  @IsEnum(Metric)
  metric: Metric;

  @ApiProperty({
    enum: Operator,
    example: Operator.GTE,
    description:
      'Comparison operator. AND / OR are not operators here — ' +
      'grouping is handled by the ruleGroups structure itself.',
  })
  @IsEnum(Operator)
  operator: Operator;

  @ApiProperty({
    example: 10,
    description: 'Target value to compare the metric against.',
  })
  @IsNumber()
  value: number;
}

// ─── Rule group ────────────────────────────────────────────────────────────────
// A group is a set of rules that are AND-ed together.
// Multiple groups in one incentive are OR-ed together.
//
// Example:
//   Group A: completed_deliveries >= 10  AND  acceptance_rate >= 90
//   Group B: total_earnings >= 5000
//
//   User qualifies if  (Group A passes)  OR  (Group B passes).
export class IncentiveRuleGroupDto {
  @ApiPropertyOptional({
    example: 'Group A',
    description:
      'Optional display label for the group (shown in admin UI). ' +
      'Does not affect evaluation logic.',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    type: [IncentiveRuleDto],
    description: 'Rules inside this group — ALL must pass (AND logic).',
    example: [
      { metric: 'COMPLETED_DELIVERIES', operator: 'GTE', value: 10 },
      { metric: 'ACCEPTANCE_RATE', operator: 'GTE', value: 90 },
    ],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Each rule group must contain at least one rule.' })
  @ValidateNested({ each: true })
  @Type(() => IncentiveRuleDto)
  rules: IncentiveRuleDto[];
}

// ─── Main create DTO ───────────────────────────────────────────────────────────
export class CreateIncentiveDto {
  @ApiProperty({ example: 'Summer Bonus' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  // ─── Schedule ───────────────────────────────────────────────────────────────
  @ApiProperty({ enum: RecurringType, example: RecurringType.ONE_TIME })
  @IsEnum(RecurringType)
  recurring_type: RecurringType;

  @ApiProperty({ description: 'Start date (ISO 8601). Always required.' })
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({
    description:
      'End date (ISO 8601). Required for DAILY / WEEKLY / MONTHLY. ' +
      'Omit for ONE_TIME.',
  })
  @ValidateIf((o) => o.recurring_type !== RecurringType.ONE_TIME)
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    enum: DayOfWeek,
    isArray: true,
    example: ['MON', 'WED', 'FRI'],
    description:
      'Required for WEEKLY. Also used with week_of_month for the MONTHLY week-based path.',
  })
  @ValidateIf((o) => o.recurring_type === RecurringType.WEEKLY)
  @ArrayNotEmpty({ message: 'days_of_week must not be empty for WEEKLY schedule.' })
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  days_of_week?: DayOfWeek[];

  @ApiPropertyOptional({
    enum: MonthName,
    example: 'Jan',
    description: 'Required for MONTHLY.',
  })
  @ValidateIf((o) => o.recurring_type === RecurringType.MONTHLY)
  @IsEnum(MonthName, { message: 'month must be a valid month name (Jan–Dec).' })
  month?: MonthName;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 5, 10],
    description:
      'Day(s) of month (1–31) for MONTHLY day-based path. ' +
      'Validated against the selected month\'s max days.',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  day_of_month?: number[];

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2],
    description: 'Week(s) of month (1–5) for MONTHLY week-based path. Use with days_of_week.',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(5, { each: true })
  week_of_month?: number[];

  // ─── Incentive config ────────────────────────────────────────────────────────
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

  // ─── Rule groups ─────────────────────────────────────────────────────────────
  // Optional — if omitted, the incentive has no eligibility restrictions.
  //
  // AND within a group  →  all rules in the group must pass.
  // OR  across groups   →  user qualifies if any one group fully passes.
  //
  // Example payload:
  // "ruleGroups": [
  //   {
  //     "label": "Group A",
  //     "rules": [
  //       { "metric": "COMPLETED_DELIVERIES", "operator": "GTE", "value": 10 },
  //       { "metric": "ACCEPTANCE_RATE",      "operator": "GTE", "value": 90 }
  //     ]
  //   },
  //   {
  //     "label": "Group B",
  //     "rules": [
  //       { "metric": "TOTAL_EARNINGS", "operator": "GTE", "value": 5000 }
  //     ]
  //   }
  // ]
  @ApiPropertyOptional({
    type: [IncentiveRuleGroupDto],
    description:
      'Rule groups. AND within a group, OR across groups. ' +
      'Omit entirely to create an incentive with no eligibility rules.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncentiveRuleGroupDto)
  ruleGroups?: IncentiveRuleGroupDto[];
}