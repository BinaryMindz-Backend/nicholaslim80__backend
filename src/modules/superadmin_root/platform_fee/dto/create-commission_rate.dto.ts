import { ApiProperty } from '@nestjs/swagger';
import { ApplicableTyp } from '@prisma/client';
import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';



export class CreateStandardCommissionRateDto {
 @ApiProperty({ description: 'Applicable user type', enum: ApplicableTyp, example: 'RAIDER' })
  @IsEnum(ApplicableTyp, { message: 'applicable_user must be a valid ApplicableTyp' })
  applicable_user: ApplicableTyp;

  @ApiProperty({ description: 'Role name', example: 'Standard Rate' })
  @IsString()
  role_name: string;

  @ApiProperty({ description: 'Commission rate for delivery fee', example: 50, default: 0 })
  @IsOptional()
  @IsInt()
  commission_rate_delivery_fee?: number;

  @ApiProperty({ description: 'Service area', example: 'Dhaka' })
  @IsString()
  service_area: string;
}
