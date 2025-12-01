import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({ description: 'Service area', example: 'Dhaka' })
  @IsString()
  service_area: string;
}
