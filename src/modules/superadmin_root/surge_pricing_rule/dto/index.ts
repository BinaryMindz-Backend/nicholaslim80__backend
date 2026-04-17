import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { SurgePricingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'ratioToGreaterThanFrom', async: false })
class RatioToGreaterThanFrom implements ValidatorConstraintInterface {
  validate(ratioTo: number, args: ValidationArguments) {
    const obj = args.object as CreateSurgePricingRuleDto;
    return ratioTo > obj.ratioFrom;
  }
  defaultMessage() {
    return 'ratioTo must be greater than ratioFrom';
  }
}

export class CreateSurgePricingRuleDto {
  @ApiProperty({ example: 'High Demand Level 1' })
  @IsString()
  @IsNotEmpty()
  ruleName: string;

  @ApiProperty({ example: 1.0, description: 'Minimum demand-to-driver ratio' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Type(() => Number)
  ratioFrom: number;

  @ApiProperty({ example: 1.5, description: 'Maximum demand-to-driver ratio' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Validate(RatioToGreaterThanFrom)
  @Type(() => Number)
  ratioTo: number;

  @ApiProperty({ example: 1.1, description: 'Surge multiplier applied within this ratio range' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Type(() => Number)
  priceMultiplier: number;

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'Service Zone IDs to apply this rule to (optional, leave empty for all zones)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  serviceZoneIds?: number[];

  @ApiPropertyOptional({
    example: [1, 3],
    description: 'Delivery Type IDs to apply this rule to (optional, leave empty for all types)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  deliveryTypeIds?: number[];

  @ApiPropertyOptional({ example: 2.0, description: 'Maximum surge price cap (optional)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Type(() => Number)
  maxCap?: number;

  @ApiPropertyOptional({ enum: SurgePricingStatus, default: SurgePricingStatus.ACTIVE })
  @IsOptional()
  @IsEnum(SurgePricingStatus)
  status?: SurgePricingStatus;
}

export class UpdateSurgePricingRuleDto extends PartialType(CreateSurgePricingRuleDto) {}

export class SurgePricingRuleQueryDto {
  @ApiPropertyOptional({ enum: SurgePricingStatus })
  @IsOptional()
  @IsEnum(SurgePricingStatus)
  status?: SurgePricingStatus;

  @ApiPropertyOptional({ example: 1, description: 'Filter by service zone ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  serviceZoneId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by delivery type ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  deliveryTypeId?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

export class ResolveSurgeDto {
  @ApiProperty({ example: 1.3, description: 'Current demand-to-driver ratio' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Type(() => Number)
  ratio: number;

  @ApiPropertyOptional({ example: 1, description: 'Service Zone ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  serviceZoneId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Delivery Type ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  deliveryTypeId?: number;
}