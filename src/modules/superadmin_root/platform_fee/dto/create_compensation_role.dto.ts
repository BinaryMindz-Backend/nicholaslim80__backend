import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { ApplicableTyp } from '@prisma/client';

export class CreateRaiderCompensationRoleDto {
  @ApiProperty({ description: 'Applicable user type', enum: ApplicableTyp, example: 'RAIDER' })
  @IsEnum(ApplicableTyp)
  applicable_user: ApplicableTyp;

  @ApiProperty({ description: 'Scenario name', example: 'Rush Hour' })
  @IsString()
  scenario: string;

  @ApiProperty({ description: 'Commission rate for delivery fee', example: 50, default: 0 })
  @IsOptional()
  @IsInt()
  commission_rate_delivery_fee?: number;

  @ApiPropertyOptional({ description: 'Service area id', example: 1 })
  @IsOptional()
  @IsInt()
  service_area_id?: number;
}
