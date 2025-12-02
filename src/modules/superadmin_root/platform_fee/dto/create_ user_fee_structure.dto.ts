import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { ApplicableTyp, FeeAppliesType } from '@prisma/client';

export class CreateUserFeeStructureDto {
  @ApiProperty({ description: 'Applicable user type', enum: ApplicableTyp, example: 'RAIDER' })
  @IsEnum(ApplicableTyp)
  applicable_user: ApplicableTyp;

  @ApiProperty({ description: 'Fee name', example: 'Service Fee' })
  @IsString()
  fee_name: string;

  @ApiProperty({ description: 'Amount of the fee', example: 50, default: 0 })
  @IsOptional()
  @IsInt()
  amount?: number;

  @ApiProperty({ description: 'Service area', example: 'Dhaka' })
  @IsString()
  service_area: string;

  @ApiProperty({ description: 'Applies to type', enum: FeeAppliesType, example: 'ALL_ORDERS' })
  @IsEnum(FeeAppliesType)
  applies_to: FeeAppliesType;
}
