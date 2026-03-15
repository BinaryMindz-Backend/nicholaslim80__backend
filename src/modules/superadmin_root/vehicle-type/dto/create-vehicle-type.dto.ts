import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleTypeEnum } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';


export class CreateVehicleTypeDto {

  @ApiProperty({
    required: true,
    example: VehicleTypeEnum.CAR,
  })
  @IsEnum(VehicleTypeEnum)
  vehicle_type: VehicleTypeEnum;

  @ApiPropertyOptional({
    required: false,
    example: 'SUV',
  })
  @IsString()
  @IsOptional()
  vehicle_name?: string;

  @ApiPropertyOptional({
    required: false,
    example: 'Write Vehicle desc',
  })
  @IsString()
  @IsOptional()
  vehicle_desc: string;

  @ApiProperty({ required: false, example: 50.0 })
  @IsOptional()
  @IsNumber()
  base_price?: number;

  @ApiProperty({ required: false, example: 12.5 })
  @IsOptional()
  @IsNumber()
  per_km_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  peak_pricing?: boolean;

  @ApiProperty({ required: false, example: '6ft x 4ft' })
  @IsOptional()
  @IsString()
  dimension?: string;

  @ApiProperty({ required: false, example: 300 })
  @IsOptional()
  @IsNumber()
  max_load?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
