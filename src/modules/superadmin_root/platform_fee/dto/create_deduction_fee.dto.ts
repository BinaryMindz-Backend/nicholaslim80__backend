import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { ApplicableTyp } from '@prisma/client';

export class CreateRaiderDeductionFeeDto {
  @ApiProperty({ description: 'Applicable user type', enum: ApplicableTyp, example: 'RAIDER' })
  @IsEnum(ApplicableTyp)
  applicable_user: ApplicableTyp;

  @ApiProperty({ description: 'Deduction name', example: 'Service Tax' })
  @IsString()
  deduction_name: string;

  @ApiProperty({ description: 'Amount of deduction', example: 50, default: 0 })
  @IsOptional()
  @IsInt()
  amount?: number;

  @ApiPropertyOptional({ description: 'Service area id', example: 1 })
  @IsOptional()
  @IsInt()
  service_area_id?: number;
}
