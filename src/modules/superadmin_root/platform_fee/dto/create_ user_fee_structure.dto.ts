import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { ApplicableTyp } from '@prisma/client';

export class CreateUserFeeStructureDto {
  @ApiProperty({
    description: 'Applicable user type',
    enum: ApplicableTyp,
    example: ApplicableTyp.USER,
  })
  @IsEnum(ApplicableTyp)
  applicable_user: ApplicableTyp;

  @ApiProperty({
    description: 'Fee name',
    example: 'Service Fee',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  fee_name: string;

  @ApiPropertyOptional({
    description: 'Flat fee amount',
    example: 50,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Service area id',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  service_area_id?: number;

  /* ---------------- 🔥 Dynamic Rule Core ---------------- */

  @ApiProperty({
    description: 'Rule type (e.g. ALL_ORDERS, DELIVERY_TYPE, ORDER_AMOUNT)',
    example: 'DELIVERY_TYPE',
  })
  @IsString()
  @MaxLength(50)
  applies_to: string;

  @ApiPropertyOptional({
    description: 'Rule key (e.g. delivery_type, order_amount, distance)',
    example: 'delivery_type',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rule_key?: string;

  @ApiPropertyOptional({
    description: 'Operator (=, >, <, >=, <=)',
    example: '=',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  rule_operator?: string;

  @ApiPropertyOptional({
    description: 'Rule value (stored as string, parsed in backend)',
    example: 'EXPRESS',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rule_value?: string;

  /* ---------------- Optional Legacy Condition ---------------- */

  @ApiPropertyOptional({
    description: 'Condition threshold value (optional legacy support)',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  condition_value?: number;

  @ApiPropertyOptional({
    description: 'Unit for condition_value',
    example: 'ORDER_AMOUNT | KM | BDT',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  condition_unit?: string;

  /* ---------------- Status ---------------- */

  @ApiPropertyOptional({
    description: 'Is fee active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}