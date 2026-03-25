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

  @ApiProperty({
    description: 'Fee application rule',
    example: "All order",
  })
  @IsString()
  applies_to: string;

  /* ---------------- Dynamic Condition Fields ---------------- */

  @ApiPropertyOptional({
    description: 'Condition threshold value (e.g. order amount, distance)',
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
