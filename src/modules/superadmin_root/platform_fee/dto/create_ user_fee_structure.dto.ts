import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsInt, IsOptional, IsEnum,
  IsBoolean, IsNumber, MaxLength, IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApplicableTyp } from '@prisma/client';

export class CreateUserFeeStructureDto {
  @ApiProperty({ enum: ApplicableTyp, example: ApplicableTyp.USER })
  @IsEnum(ApplicableTyp)
  applicable_user: ApplicableTyp;

  @ApiProperty({ example: 'Service Fee', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  fee_name: string;

  @ApiPropertyOptional({ example: 50, default: 0 })
  @IsOptional()
  @IsInt()
  amount?: number;

  // Pass [] or null to mean "ALL zones" — handle in service layer
  @ApiPropertyOptional({
    description: 'Service area IDs. Empty array = all zones.',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  service_area_ids?: number[];

  @ApiProperty({ example: 'DELIVERY_TYPE' })
  @IsString()
  @MaxLength(50)
  applies_to: string;

  @ApiPropertyOptional({ example: 'delivery_type' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rule_key?: string;

  @ApiPropertyOptional({ example: '=' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  rule_operator?: string;

  @ApiPropertyOptional({ example: 'EXPRESS' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rule_value?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  condition_value?: number;

  @ApiPropertyOptional({ example: 'ORDER_AMOUNT | KM | BDT' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  condition_unit?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}