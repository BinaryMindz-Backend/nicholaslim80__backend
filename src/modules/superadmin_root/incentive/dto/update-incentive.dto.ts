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
    ArrayNotEmpty,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IncentiveRuleDto, IncentiveRuleGroupDto } from './create-incentive.dto';

export { IncentiveRuleDto, IncentiveRuleGroupDto };

export class UpdateIncentiveDto {
    @ApiPropertyOptional({ example: 'Updated Bonus' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    // ─── Schedule ───────────────────────────────────────────────────────────────
    @ApiPropertyOptional({ enum: RecurringType })
    @IsOptional()
    @IsEnum(RecurringType)
    recurring_type?: RecurringType;

    @ApiPropertyOptional({ description: 'Start date (ISO 8601).' })
    @IsOptional()
    @IsDateString()
    start_date?: string;

    @ApiPropertyOptional({ description: 'End date (ISO 8601).' })
    @IsOptional()
    @IsDateString()
    end_date?: string;

    @ApiPropertyOptional({
        enum: DayOfWeek,
        isArray: true,
        example: ['MON', 'FRI'],
        description: 'Required when changing recurring_type to WEEKLY.',
    })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty({ message: 'days_of_week must not be empty when provided.' })
    @IsEnum(DayOfWeek, { each: true })
    days_of_week?: DayOfWeek[];

    @ApiPropertyOptional({
        enum: MonthName,
        example: 'Mar',
        description: 'Required when changing recurring_type to MONTHLY.',
    })
    @IsOptional()
    @IsEnum(MonthName, { message: 'month must be a valid month name (Jan–Dec).' })
    month?: MonthName;

    @ApiPropertyOptional({
        type: [Number],
        example: [1, 15],
        description: 'Day(s) of month (1–31) for MONTHLY day-based path.',
    })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(1, { each: true })
    @Max(31, { each: true })
    day_of_month?: number[];

    @ApiPropertyOptional({
        type: [Number],
        example: [2, 4],
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

    @ApiPropertyOptional({ example: 2 })
    @IsOptional()
    @IsNumber()
    priority?: number;

    @ApiPropertyOptional({ enum: IncentiveStatus })
    @IsOptional()
    @IsEnum(IncentiveStatus)
    status?: IncentiveStatus;

    @ApiPropertyOptional({ enum: IncentiveRewardType })
    @IsOptional()
    @IsEnum(IncentiveRewardType)
    reward_type?: IncentiveRewardType;

    @ApiPropertyOptional({ example: 75 })
    @IsOptional()
    @IsNumber()
    reward_value?: number;

    @ApiPropertyOptional({ enum: ClaimType })
    @IsOptional()
    @IsEnum(ClaimType)
    claim_type?: ClaimType;

    @ApiPropertyOptional({ example: 3 })
    @IsOptional()
    @IsNumber()
    claim_expire?: number;

    @ApiPropertyOptional({ enum: TimeUnit, example: 'DAYS' })
    @IsOptional()
    @IsEnum(TimeUnit)
    time_constant?: TimeUnit;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @IsNumber()
    max_claim?: number;

    @ApiPropertyOptional({ type: [Number], example: [1, 2, 3] })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    serviceZoneIds?: number[];

    // ─── Rule groups ─────────────────────────────────────────────────────────────
    // When provided, ALL existing rule groups for this incentive are replaced
    // atomically with the new set. Pass an empty array [] to clear all rules.
    //
    // AND within a group  →  all rules in the group must pass.
    // OR  across groups   →  user qualifies if any one group fully passes.
    //
    // Example payload:
    // "ruleGroups": [
    //   {
    //     "label": "High performer",
    //     "rules": [
    //       { "metric": "COMPLETED_DELIVERIES", "operator": "GTE", "value": 20 },
    //       { "metric": "ACCEPTANCE_RATE",      "operator": "GTE", "value": 95 }
    //     ]
    //   },
    //   {
    //     "label": "Top earner",
    //     "rules": [
    //       { "metric": "TOTAL_EARNINGS", "operator": "GTE", "value": 10000 }
    //     ]
    //   }
    // ]
    @ApiPropertyOptional({
        type: [IncentiveRuleGroupDto],
        description:
            'Replaces ALL existing rule groups when provided. ' +
            'AND within a group, OR across groups. ' +
            'Pass [] to remove all rules.',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IncentiveRuleGroupDto)
    ruleGroups?: IncentiveRuleGroupDto[];
}