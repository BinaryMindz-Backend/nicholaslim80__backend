import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApplicableTyp } from '@prisma/client';

export class CreateRaiderDeductionFeeDto {
  @ApiProperty({ description: 'Applicable user type', enum: ApplicableTyp, example: 'RAIDER' })
  @IsEnum(ApplicableTyp)
  applicable_user: ApplicableTyp;

  @ApiProperty({ description: 'Deduction name', example: 'Service Tax' })
  @IsString()
  deduction_name: string;

  @ApiPropertyOptional({ description: 'Amount of deduction', example: 50, default: 0 })
  @IsOptional()
  @IsInt()
  amount?: number;

  @ApiPropertyOptional({ description: 'Type of fee', example: '5% or 50', default: 0 })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Service area IDs. Empty array or omit = ALL zones.',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  service_area_ids?: number[];
}