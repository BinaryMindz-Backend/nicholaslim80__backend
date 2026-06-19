import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApplicableTyp } from '@prisma/client';

export class CreateRaiderCompensationRoleDto {
  @ApiProperty({ description: 'Applicable user type', enum: ApplicableTyp, example: 'RAIDER' })
  @IsEnum(ApplicableTyp)
  applicable_user: ApplicableTyp;

  @ApiProperty({ description: 'Scenario name', example: 'Rush Hour' })
  @IsString()
  scenario: string;

  @ApiPropertyOptional({ description: 'Commission rate for delivery fee', example: 50, default: 0 })
  @IsOptional()
  @IsInt()
  commission_rate_delivery_fee?: number;

  //Replaces single service_area_id — empty array = ALL zones
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